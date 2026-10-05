from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.inventory import InventoryMovement, MovementType
from app.models.product import Product
from app.repositories.product_repo import ProductRepository
from app.repositories.inventory_repo import InventoryRepository
from app.schemas.product import StockAdjustRequest
from app.schemas.inventory import LowStockAlertResponse
from app.core.exceptions import EntityNotFoundException, AppException
from app.core.logging import logger


class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        self.inventory_repo = InventoryRepository(db)

    def adjust_stock(self, product_id: int, payload: StockAdjustRequest) -> Product:
        # Lock product row
        locked_products = self.product_repo.get_for_update([product_id])
        if not locked_products:
            raise EntityNotFoundException("Product", product_id)
        
        product = locked_products[0]
        qty = abs(payload.quantity)

        if payload.movement_type == MovementType.IN:
            new_balance = product.stock_quantity + qty
            movement_qty = qty
        elif payload.movement_type == MovementType.OUT:
            if product.stock_quantity < qty:
                raise AppException(
                    f"Cannot deduct {qty} units from product '{product.sku}' with available stock of {product.stock_quantity}.",
                    code="INSUFFICIENT_STOCK",
                    status_code=400,
                )
            new_balance = product.stock_quantity - qty
            movement_qty = -qty
        elif payload.movement_type == MovementType.ADJUST:
            # Set absolute quantity
            movement_qty = payload.quantity - product.stock_quantity
            new_balance = payload.quantity
            if new_balance < 0:
                raise AppException("Stock balance cannot be adjusted to negative.", code="NEGATIVE_STOCK_FORBIDDEN", status_code=400)
        else:
            raise AppException("Invalid movement type", code="INVALID_MOVEMENT_TYPE", status_code=400)

        product.stock_quantity = new_balance
        
        self.inventory_repo.record_movement(
            product_id=product.id,
            movement_type=payload.movement_type,
            quantity=movement_qty,
            balance_after=new_balance,
            reason=payload.reason,
        )

        self.db.commit()
        self.db.refresh(product)
        logger.info(f"Stock adjusted for product {product.sku}: new balance = {product.stock_quantity}")
        return product

    def get_low_stock_alerts(self) -> List[LowStockAlertResponse]:
        products = self.product_repo.get_low_stock_products()
        alerts = []
        for p in products:
            shortage = max(0, p.reorder_level - p.stock_quantity)
            alerts.append(
                LowStockAlertResponse(
                    product_id=p.id,
                    sku=p.sku,
                    name=p.name,
                    category=p.category,
                    stock_quantity=p.stock_quantity,
                    reorder_level=p.reorder_level,
                    shortage=shortage,
                )
            )
        return alerts
