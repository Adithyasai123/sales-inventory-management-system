from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.email_log import EmailLog, EmailStatus
from app.models.inventory import InventoryMovement
from app.schemas.audit import EmailLogResponse, AuditStatsResponse

router = APIRouter(
    prefix="/audit",
    tags=["Audit & Notifications"],
)


@router.get("/emails", response_model=List[EmailLogResponse])
def get_email_logs(
    status: Optional[EmailStatus] = Query(None, description="Filter by delivery status"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE)),
):
    """Retrieve transactional email notification audit logs."""
    query = db.query(EmailLog)
    if status:
        query = query.filter(EmailLog.status == status)
    return query.order_by(desc(EmailLog.created_at)).limit(limit).all()


@router.get("/stats", response_model=AuditStatsResponse)
def get_audit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE)),
):
    """Aggregated metrics for email deliveries and system activity."""
    total = db.query(EmailLog).count()
    sent = db.query(EmailLog).filter(EmailLog.status == EmailStatus.SENT).count()
    pending = db.query(EmailLog).filter(EmailLog.status == EmailStatus.PENDING).count()
    failed = db.query(EmailLog).filter(EmailLog.status == EmailStatus.FAILED).count()
    recent_movements = db.query(InventoryMovement).count()

    return AuditStatsResponse(
        total_emails=total,
        sent_emails=sent,
        pending_emails=pending,
        failed_emails=failed,
        recent_movements=recent_movements,
    )
