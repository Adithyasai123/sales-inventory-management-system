from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.models.inventory import MovementType


class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=2, max_length=64, description="Unique product SKU")
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Decimal = Field(..., gt=0, description="Selling price (must be positive)")
    cost_price: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: int = Field(default=0, ge=0, description="Initial stock quantity")
    reorder_level: int = Field(default=10, ge=0, description="Threshold for low-stock warning")


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=2, max_length=64)
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Decimal
    cost_price: Optional[Decimal] = None
    stock_quantity: int
    reorder_level: int
    is_active: bool
    is_deleted: bool = False
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StockAdjustRequest(BaseModel):
    movement_type: MovementType
    quantity: int = Field(..., description="Quantity to adjust (positive for IN, positive for OUT/ADJUST magnitude)")
    reason: str = Field(..., min_length=3, max_length=255, description="Audit reason for manual stock alteration")
