from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_serializer
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

    @field_serializer("created_at", "sent_at", check_fields=False)
    def serialize_dt(self, dt: Optional[datetime], _info):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class AuditStatsResponse(BaseModel):
    total_emails: int
    sent_emails: int
    pending_emails: int
    failed_emails: int
    recent_movements: int
