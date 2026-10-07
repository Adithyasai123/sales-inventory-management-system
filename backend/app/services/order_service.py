from decimal import Decimal
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import BackgroundTasks

from app.models.order import SalesOrder, SalesOrderItem, OrderStatus
from app.models.product import Product
from app.models.inventory import MovementType
from app.models.user import User
from app.repositories.order_repo import OrderRepository
from app.repositories.customer_repo import CustomerRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.inventory_repo import InventoryRepository
from app.repositories.setting_repo import SettingRepository
from app.schemas.order import OrderCreate
from app.services.email_service import EmailService
from app.core.exceptions import (
    EntityNotFoundException,
    InsufficientStockException,
    InvalidStateTransitionException,
    ValidationException,
    AppException,
)
from app.core.logging import logger


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.customer_repo = CustomerRepository(db)
        self.product_repo = ProductRepository(db)
        self.inventory_repo = InventoryRepository(db)
        self.setting_repo = SettingRepository(db)

    def create_order(
        self,
        payload: OrderCreate,
        creator: User,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> SalesOrder:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                return self._create_order_attempt(payload, creator, background_tasks)
            except IntegrityError as exc:
                self.db.rollback()
                err_msg = str(exc).lower()
                if ("order_number" in err_msg or "unique" in err_msg) and attempt < max_retries - 1:
                    logger.warning(
                        f"Order number collision on attempt {attempt + 1}, retrying with a fresh order number..."
                    )
                    time.sleep(0.05 * (attempt + 1))
                    continue
                raise

    def _create_order_attempt(
        self,
        payload: OrderCreate,
        creator: User,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> SalesOrder:
        # 1. Validate Customer
        customer = self.customer_repo.get_by_id(payload.customer_id)
        if not customer or not customer.is_active:
            raise EntityNotFoundException("Active Customer", payload.customer_id)

        # 2. Check for duplicate products in lines
        product_ids = [item.product_id for item in payload.items]
        if len(product_ids) != len(set(product_ids)):
            raise AppException("Duplicate product lines are not permitted in an order", code="DUPLICATE_ORDER_LINE", status_code=400)

        # 3. Fetch products and lock rows if needed
        # Fetch products
        products_map: Dict[int, Product] = {}
        for pid in product_ids:
            p = self.product_repo.get_by_id(pid)
            if not p or not p.is_active:
                raise EntityNotFoundException("Active Product", pid)
            products_map[pid] = p

        # 4. Validate Available Stock and Calculate Totals server-side
        subtotal = Decimal("0.00")
        items_to_create: List[Dict[str, Any]] = []

        for item_in in payload.items:
            product = products_map[item_in.product_id]
            avail_stock = product.stock_quantity - getattr(product, "reserved_quantity", 0)
            if avail_stock < item_in.quantity:
                raise InsufficientStockException(
                    product_id=product.id,
                    sku=product.sku,
                    requested=item_in.quantity,
                    available=max(0, avail_stock),
                )
            
            line_price = Decimal(str(product.price))
            line_total = line_price * item_in.quantity
            subtotal += line_total

            items_to_create.append({
                "product_id": product.id,
                "quantity": item_in.quantity,
                "unit_price": line_price,
                "total_price": line_total,
            })

        # Calculate Tax & Total
        tax_rate = payload.tax_rate
        tax_amount = (subtotal * tax_rate / Decimal("100.00")).quantize(Decimal("0.01"))
        total_amount = (subtotal + tax_amount).quantize(Decimal("0.01"))

        # 5. Check Approval Threshold
        threshold = self.setting_repo.get_approval_threshold()
        requires_approval = total_amount > threshold

        order_number = self.order_repo.generate_next_order_number()

        # 6. Determine Initial Status
        if requires_approval:
            status = OrderStatus.PENDING_APPROVAL
        else:
            status = OrderStatus.COMPLETED

        order = SalesOrder(
            order_number=order_number,
            customer_id=customer.id,
            creator_id=creator.id,
            status=status,
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            notes=payload.notes,
            requires_approval=requires_approval,
        )
        self.db.add(order)
        self.db.flush()

        # Create Items
        for item_data in items_to_create:
            order_item = SalesOrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                total_price=item_data["total_price"],
            )
            self.db.add(order_item)

        # 7. Stock Allocation:
        # Lock products in deterministic ascending order to prevent deadlocks
        locked_products = self.product_repo.get_for_update(product_ids)
        locked_map = {p.id: p for p in locked_products}

        if requires_approval:
            # High-value orders: atomically RESERVE stock so it cannot be oversold while pending
            for item_in in payload.items:
                prod = locked_map[item_in.product_id]
                avail = prod.stock_quantity - prod.reserved_quantity
                if avail < item_in.quantity:
                    raise InsufficientStockException(
                        product_id=prod.id,
                        sku=prod.sku,
                        requested=item_in.quantity,
                        available=max(0, avail),
                    )
                prod.reserved_quantity += item_in.quantity
        else:
            # Total <= threshold: auto-completed -> deduct physical stock and record movement
            for item_in in payload.items:
                prod = locked_map[item_in.product_id]
                avail = prod.stock_quantity - prod.reserved_quantity
                if avail < item_in.quantity:
                    raise InsufficientStockException(
                        product_id=prod.id,
                        sku=prod.sku,
                        requested=item_in.quantity,
                        available=max(0, avail),
                    )
                prod.stock_quantity -= item_in.quantity
                self.inventory_repo.record_movement(
                    product_id=prod.id,
                    movement_type=MovementType.OUT,
                    quantity=-item_in.quantity,
                    balance_after=prod.stock_quantity,
                    reference_order_id=order.id,
                    reason=f"Auto-fulfilled order {order.order_number}",
                )

        # 8. Create EmailLog rows INSIDE transaction (before commit) so they commit atomically
        pending_emails = []
        if requires_approval:
            pending_emails = EmailService.create_approval_request_logs(
                db=self.db,
                order_number=order.order_number,
                total_amount=order.total_amount,
                creator_name=creator.full_name,
                customer_name=customer.name,
            )

        self.db.commit()
        self.db.refresh(order)

        # 9. Schedule SMTP background tasks AFTER commit so log_ids are committed and visible
        for log_id, to_email, subject, html_body in pending_emails:
            if background_tasks:
                background_tasks.add_task(
                    EmailService._send_smtp_email, to_email, subject, html_body, log_id
                )
            else:
                EmailService._send_smtp_email(to_email, subject, html_body, log_id)

        logger.info(f"Order created: {order.order_number} (Status: {order.status.value}, Total: ₹{order.total_amount})")
        return self.order_repo.get_with_details(order.id)

    def cancel_order(self, order_id: int, user: User) -> SalesOrder:
        order = self.order_repo.get_with_details(order_id)
        if not order:
            raise EntityNotFoundException("SalesOrder", order_id)

        # Only orders in DRAFT or PENDING_APPROVAL can be cancelled
        if order.status not in [OrderStatus.DRAFT, OrderStatus.PENDING_APPROVAL]:
            raise InvalidStateTransitionException(
                current_state=order.status.value,
                target_state=OrderStatus.CANCELLED.value,
                reason="Only orders in DRAFT or PENDING_APPROVAL status can be cancelled.",
            )

        # If order was PENDING_APPROVAL, release any reserved stock
        if order.status == OrderStatus.PENDING_APPROVAL and order.items:
            product_ids = [item.product_id for item in order.items]
            locked_products = self.product_repo.get_for_update(product_ids)
            locked_map = {p.id: p for p in locked_products}
            for item in order.items:
                prod = locked_map.get(item.product_id)
                if prod:
                    prod.reserved_quantity = max(0, prod.reserved_quantity - item.quantity)

        order.status = OrderStatus.CANCELLED
        self.db.commit()
        self.db.refresh(order)
        logger.info(f"Order {order.order_number} cancelled by user {user.email}")
        return order
