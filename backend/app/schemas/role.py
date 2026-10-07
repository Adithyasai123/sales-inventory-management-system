from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, Field, field_validator


class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, description="Unique role identifier (e.g., WAREHOUSE, AUDITOR)")
    display_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    allowed_screens: List[str] = Field(default_factory=lambda: ["dashboard"])

    # Granular capability permissions
    can_create_orders: bool = False
    can_approve_orders: bool = False
    can_adjust_stock: bool = False
    can_manage_products: bool = False
    can_manage_customers: bool = False
    can_manage_users: bool = False
    can_manage_settings: bool = False
    can_view_audit: bool = False

    @field_validator("name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        return v.strip().upper().replace(" ", "_")


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    allowed_screens: Optional[List[str]] = None
    can_create_orders: Optional[bool] = None
    can_approve_orders: Optional[bool] = None
    can_adjust_stock: Optional[bool] = None
    can_manage_products: Optional[bool] = None
    can_manage_customers: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_manage_settings: Optional[bool] = None
    can_view_audit: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str] = None
    is_system: bool = False
    allowed_screens: List[str] = []
    can_create_orders: bool = False
    can_approve_orders: bool = False
    can_adjust_stock: bool = False
    can_manage_products: bool = False
    can_manage_customers: bool = False
    can_manage_users: bool = False
    can_manage_settings: bool = False
    can_view_audit: bool = False
    users_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
