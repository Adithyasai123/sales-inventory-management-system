from datetime import datetime
from typing import Optional
import re
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=150)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format")
        return v


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    company: Optional[str] = Field(None, max_length=150)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
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


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
