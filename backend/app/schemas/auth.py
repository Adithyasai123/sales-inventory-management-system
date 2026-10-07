import re
from typing import List, Optional, Union
from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_REGEX.match(v):
            raise ValueError("Invalid email address format")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class LoginResponse(BaseModel):
    message: str = "Login successful"
    user: Optional["UserMeResponse"] = None


class RefreshResponse(BaseModel):
    message: str = "Token refreshed successfully"


from datetime import datetime

class UserMeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: Union[UserRole, str]
    role_id: Optional[int] = None
    is_active: bool
    is_super_admin: bool = False
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    branch: Optional[str] = "Hyderabad"
    allowed_screens: List[str] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
