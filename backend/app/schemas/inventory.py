from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.inventory import MovementType


class InventoryMovementResponse(BaseModel):
    id: int
    product_id: int
    product_sku: str
    product_name: str
    movement_type: MovementType
    quantity: int
    balance_after: int
    reference_order_id: Optional[int] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LowStockAlertResponse(BaseModel):
    product_id: int
    sku: str
    name: str
    category: Optional[str] = None
    stock_quantity: int
    reorder_level: int
    shortage: int

    class Config:
        from_attributes = True
