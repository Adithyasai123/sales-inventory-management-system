from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_serializer
from app.models.order import OrderStatus
from app.schemas.customer import CustomerResponse
from app.schemas.approval import ApprovalHistoryResponse


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be strictly positive")


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one line item")
    tax_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100, description="Tax percentage rate (e.g. 10.00)")
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_sku: str
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: str
    creator_id: int
    creator_name: str
    status: OrderStatus
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    requires_approval: bool
    notes: Optional[str] = None
    items_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @field_serializer("created_at", "updated_at", check_fields=False)
    def serialize_dt(self, dt: Optional[datetime], _info):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class OrderDetailResponse(OrderResponse):
    customer: CustomerResponse
    items: List[OrderItemResponse]
    approvals: List[ApprovalHistoryResponse] = []


class OrderFilterParams(BaseModel):
    status: Optional[OrderStatus] = None
    customer_id: Optional[int] = None
    creator_id: Optional[int] = None
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: str = "desc"
