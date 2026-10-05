from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class SystemSettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    value: str = Field(..., min_length=1, max_length=255)


class ApprovalThresholdUpdate(BaseModel):
    threshold: Decimal = Field(..., gt=0, description="New monetary threshold above which orders require manager approval")
