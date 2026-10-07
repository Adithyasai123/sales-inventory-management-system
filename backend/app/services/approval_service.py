from typing import Optional
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks

from app.models.order import SalesOrder, OrderStatus
from app.models.product import Product
from app.models.approval import ApprovalDecision, OrderApproval
from app.models.inventory import MovementType
from app.models.user import User, UserRole
from app.repositories.order_repo import OrderRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.approval_repo import ApprovalRepository
from app.repositories.inventory_repo import InventoryRepository
from app.services.email_service import EmailService
from app.schemas.approval import ApprovalActionRequest
from app.core.exceptions import (
    EntityNotFoundException,
    InsufficientStockException,
    InvalidStateTransitionException,
    SelfApprovalException,
    PermissionDeniedException,
)
from app.core.logging import logger


class ApprovalService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)
        self.approval_repo = ApprovalRepository(db)
        self.inventory_repo = InventoryRepository(db)

    def process_approval(
        self,
        order_id: int,
        action: ApprovalActionRequest,
        approver: User,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> SalesOrder:
        # 1. RBAC check: Only MANAGER or ADMIN
        if approver.role not in [UserRole.MANAGER, UserRole.ADMIN]:
            raise PermissionDeniedException("MANAGER or ADMIN")

        # 2. Fetch order with details
        order = self.order_repo.get_with_details(order_id)
        if not order:
            raise EntityNotFoundException("SalesOrder", order_id)

        # 3. Check Idempotency
        if action.decision == ApprovalDecision.APPROVED and order.status == OrderStatus.COMPLETED:
            logger.info(f"Order {order.order_number} already COMPLETED (idempotent approve call)")
            return order
        if action.decision == ApprovalDecision.REJECTED and order.status == OrderStatus.REJECTED:
            logger.info(f"Order {order.order_number} already REJECTED (idempotent reject call)")
            return order

        # 4. State validation: Must be in PENDING_APPROVAL
        if order.status != OrderStatus.PENDING_APPROVAL:
            raise InvalidStateTransitionException(
                current_state=order.status.value,
                target_state=action.decision.value,
                reason="Only orders in PENDING_APPROVAL status can be reviewed by a manager.",
            )

        # 5. Prevent Self-Approval: Nobody can approve their own order
        if order.creator_id == approver.id:
            raise SelfApprovalException()

        # 6. Branch on Decision
        if action.decision == ApprovalDecision.APPROVED:
            # Execute in one single atomic transaction:
            # Lock product rows with SELECT ... FOR UPDATE
            product_ids = [item.product_id for item in order.items]
            locked_products = self.product_repo.get_for_update(product_ids)
            locked_map = {p.id: p for p in locked_products}

            # RE-VALIDATE stock availability
            for item in order.items:
                product = locked_map.get(item.product_id)
                if not product or product.stock_quantity < item.quantity:
                    available = product.stock_quantity if product else 0
                    logger.warning(
                        f"Insufficient stock on approval for order {order.order_number}, product {item.product_id}. "
                        f"Requested: {item.quantity}, Available: {available}"
                    )
                    raise InsufficientStockException(
                        product_id=item.product_id,
                        sku=item.product.sku if item.product else "UNKNOWN",
                        requested=item.quantity,
                        available=available,
                    )

            # Deduct stock atomically, release reservation, and write to inventory_movements ledger
            for item in order.items:
                product = locked_map[item.product_id]
                new_reserved = max(0, (product.reserved_quantity or 0) - item.quantity)
                affected = (
                    self.db.query(Product)
                    .filter(
                        Product.id == product.id,
                        Product.stock_quantity >= item.quantity,
                        Product.is_deleted == False,
                    )
                    .update(
                        {
                            Product.stock_quantity: Product.stock_quantity - item.quantity,
                            Product.reserved_quantity: new_reserved,
                        },
                        synchronize_session="fetch",
                    )
                )
                if affected == 0:
                    self.db.refresh(product)
                    logger.warning(
                        f"Insufficient stock on approval for order {order.order_number}, product {item.product_id}. "
                        f"Requested: {item.quantity}, Available: {product.stock_quantity}"
                    )
                    raise InsufficientStockException(
                        product_id=item.product_id,
                        sku=product.sku,
                        requested=item.quantity,
                        available=product.stock_quantity,
                    )

                self.inventory_repo.record_movement(
                    product_id=product.id,
                    movement_type=MovementType.OUT,
                    quantity=-item.quantity,
                    balance_after=product.stock_quantity,
                    reference_order_id=order.id,
                    reason=f"Approved order fulfillment: {order.order_number}",
                )

            # Update Order Status to COMPLETED
            order.status = OrderStatus.COMPLETED

        elif action.decision == ApprovalDecision.REJECTED:
            # Release reserved stock on rejection
            product_ids = [item.product_id for item in order.items]
            locked_products = self.product_repo.get_for_update(product_ids)
            locked_map = {p.id: p for p in locked_products}
            for item in order.items:
                product = locked_map.get(item.product_id)
                if product:
                    product.reserved_quantity = max(0, product.reserved_quantity - item.quantity)

            order.status = OrderStatus.REJECTED

        # 7. Record approval audit trail
        self.approval_repo.record_decision(
            order_id=order.id,
            approver_id=approver.id,
            decision=action.decision,
            comment=action.comment,
        )

        # 8. Create EmailLog row INSIDE transaction (before commit) so it commits atomically
        pending_email: Optional[tuple] = None
        if order.creator:
            pending_email = EmailService.create_decision_log(
                db=self.db,
                creator_email=order.creator.email,
                creator_name=order.creator.full_name,
                order_number=order.order_number,
                decision=action.decision.value,
                comment=action.comment,
                total_amount=order.total_amount,
            )

        self.db.commit()
        self.db.refresh(order)

        # 9. Schedule SMTP background task AFTER commit so log_id is committed and visible
        if pending_email:
            log_id, to_email, subject, html_body = pending_email
            if background_tasks:
                background_tasks.add_task(
                    EmailService._send_smtp_email, to_email, subject, html_body, log_id
                )
            else:
                EmailService._send_smtp_email(to_email, subject, html_body, log_id)

        logger.info(f"Order {order.order_number} {action.decision.value} by {approver.email}")
        return self.order_repo.get_with_details(order.id)
