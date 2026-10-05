from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.approval import ApprovalDecision


class ApprovalActionRequest(BaseModel):
    decision: ApprovalDecision
    comment: str = Field(..., min_length=2, max_length=500, description="Mandatory audit explanation for approval/rejection decision")


class ApprovalHistoryResponse(BaseModel):
    id: int
    order_id: int
    approver_id: int
    approver_name: str
    approver_email: str
    decision: ApprovalDecision
    comment: Optional[str] = None
    decided_at: datetime

    class Config:
        from_attributes = True
