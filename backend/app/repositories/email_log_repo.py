from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.email_log import EmailLog, EmailStatus
from app.repositories.base import BaseRepository


class EmailLogRepository(BaseRepository[EmailLog]):
    def __init__(self, db: Session):
        super().__init__(EmailLog, db)

    def create_log(self, recipient: str, subject: str, body_preview: Optional[str] = None) -> EmailLog:
        log = EmailLog(
            recipient=recipient,
            subject=subject,
            body_preview=body_preview,
            status=EmailStatus.PENDING,
        )
        self.db.add(log)
        self.db.flush()
        return log

    def mark_sent(self, log_id: int) -> None:
        log = self.get_by_id(log_id)
        if log:
            log.status = EmailStatus.SENT
            log.sent_at = datetime.now(timezone.utc)
            self.db.flush()

    def mark_failed(self, log_id: int, error_message: str) -> None:
        log = self.get_by_id(log_id)
        if log:
            log.status = EmailStatus.FAILED
            log.error_message = error_message
            log.retries += 1
            self.db.flush()

    def list_logs(self, skip: int = 0, limit: int = 50) -> Tuple[List[EmailLog], int]:
        query = self.db.query(EmailLog)
        total = query.count()
        items = query.order_by(EmailLog.created_at.desc()).offset(skip).limit(limit).all()
        return items, total
