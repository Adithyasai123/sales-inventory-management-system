from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.email_log import EmailStatus


class EmailLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recipient: str
    subject: str
    body_preview: Optional[str] = None
    status: EmailStatus
    error_message: Optional[str] = None
    retries: int
    created_at: datetime
    sent_at: Optional[datetime] = None


class AuditStatsResponse(BaseModel):
    total_emails: int
    sent_emails: int
    pending_emails: int
    failed_emails: int
    recent_movements: int
