from datetime import datetime
from typing import Optional
import re
from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserCreate(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.SALES

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format")
        return v


class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=255)
    password: Optional[str] = Field(None, min_length=6)
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
