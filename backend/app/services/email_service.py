import os
import smtplib
import time
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Tuple
from decimal import Decimal
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.core.database import SessionLocal
from app.models.email_log import EmailLog, EmailStatus
from app.models.user import User, UserRole

MAX_RETRIES = 3
RETRY_BACKOFF = [1, 2, 4]  # seconds between retries

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "emails")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)


class EmailService:
    @staticmethod
    def _send_smtp_email(to_email: str, subject: str, html_body: str, log_id: Optional[int] = None) -> bool:
        """Synchronously dispatch email to SMTP server (executed inside BackgroundTasks).

        Opens its own DB session so it can run independently of the request session.
        Retries up to MAX_RETRIES times on failure with backoff.
        SMTP errors are caught and logged; they never fail the request.
        """
        db = SessionLocal()
        try:
            last_error: Optional[str] = None
            for attempt in range(MAX_RETRIES):
                try:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subject
                    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
                    msg["To"] = to_email
                    part = MIMEText(html_body, "html")
                    msg.attach(part)

                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                        if settings.SMTP_TLS:
                            server.starttls()
                        if settings.SMTP_USER and settings.SMTP_PASSWORD:
                            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())

                    logger.info(f"Email successfully sent to {to_email} | Subject: {subject} (attempt {attempt + 1})")

                    if log_id:
                        email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                        if email_log:
                            email_log.status = EmailStatus.SENT
                            email_log.sent_at = datetime.now(timezone.utc)
                            db.commit()
                    return True

                except Exception as exc:
                    last_error = str(exc)
                    logger.warning(
                        f"SMTP attempt {attempt + 1}/{MAX_RETRIES} failed for {to_email}: {last_error}"
                    )
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_BACKOFF[attempt])

            error_msg = f"Failed to send email to {to_email} after {MAX_RETRIES} attempts: {last_error}"
            logger.error(error_msg)
            if log_id:
                email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                if email_log:
                    email_log.status = EmailStatus.FAILED
                    email_log.error_message = error_msg
                    email_log.retries = MAX_RETRIES
                    db.commit()
            return False

        except Exception as exc:
            logger.error(f"Unexpected error in _send_smtp_email: {exc}")
            return False
        finally:
            db.close()

    @classmethod
    def create_approval_request_logs(
        cls,
        db: Session,
        order_number: str,
        total_amount: Decimal,
        creator_name: str,
        customer_name: str,
    ) -> List[Tuple[int, str, str, str]]:
        """Create EmailLog rows with status PENDING within the caller's DB transaction.

        Must be called BEFORE db.commit() in the order transaction.
        Returns list of (log_id, to_email, subject, html_content) for post-commit dispatch.
        """
        managers = (
            db.query(User)
            .filter(
                User.role.in_([UserRole.MANAGER, UserRole.ADMIN]),
                User.is_active == True,
                User.is_deleted == False,
            )
            .all()
        )

        subject = f"[Action Required] Order {order_number} Requires Manager Approval"
        formatted_amount = f"₹{total_amount:,.2f}"

        template = jinja_env.get_template("approval_request.html")
        html_content = template.render(
            order_number=order_number,
            customer_name=customer_name,
            creator_name=creator_name,
            formatted_amount=formatted_amount,
        )

        results: List[Tuple[int, str, str, str]] = []
        for manager in managers:
            log = EmailLog(
                recipient=manager.email,
                subject=subject,
                body_preview=f"Order {order_number} ({formatted_amount}) created by {creator_name} requires approval.",
                status=EmailStatus.PENDING,
            )
            db.add(log)
            db.flush()
            results.append((log.id, manager.email, subject, html_content))

        return results

    @classmethod
    def create_decision_log(
        cls,
        db: Session,
        creator_email: str,
        creator_name: str,
        order_number: str,
        decision: str,
        comment: str,
        total_amount: Decimal,
    ) -> Tuple[int, str, str, str]:
        """Create an EmailLog row with status PENDING within the caller's DB transaction.

        Must be called BEFORE db.commit() in the approval transaction.
        Returns (log_id, to_email, subject, html_content) for post-commit dispatch.
        """
        subject = f"[Order Update] Your Order {order_number} has been {decision}"
        decision_color = "#0F3D33" if decision == "APPROVED" else "#8A1C14"
        formatted_amount = f"₹{total_amount:,.2f}"

        template = jinja_env.get_template("decision_notification.html")
        html_content = template.render(
            creator_name=creator_name,
            order_number=order_number,
            formatted_amount=formatted_amount,
            decision=decision,
            decision_color=decision_color,
            comment=comment,
        )

        log = EmailLog(
            recipient=creator_email,
            subject=subject,
            body_preview=f"Order {order_number} was {decision}. Comment: {comment}",
            status=EmailStatus.PENDING,
        )
        db.add(log)
        db.flush()
        return (log.id, creator_email, subject, html_content)

    @classmethod
    def sweep_pending_emails(cls, db: Optional[Session] = None, limit: int = 50) -> int:
        """Outbox Sweeper: Finds un-dispatched PENDING emails and retries them synchronously.
        Provides at-least-once delivery guarantee across application restarts.
        """
        local_session = False
        if db is None:
            db = SessionLocal()
            local_session = True

        try:
            pending_logs = (
                db.query(EmailLog)
                .filter(
                    EmailLog.status.in_([EmailStatus.PENDING, EmailStatus.FAILED]),
                    EmailLog.retries < MAX_RETRIES,
                )
                .order_by(EmailLog.id.asc())
                .limit(limit)
                .all()
            )

            dispatched_count = 0
            for log in pending_logs:
                # Dispatch if body preview exists
                success = cls._send_smtp_email(
                    to_email=log.recipient,
                    subject=log.subject,
                    html_body=f"<p>{log.body_preview}</p>",
                    log_id=log.id,
                )
                if success:
                    dispatched_count += 1

            return dispatched_count
        finally:
            if local_session:
                db.close()

    @classmethod
    def send_approval_request_to_managers(
        cls,
        db: Session,
        background_tasks,
        order_number: str,
        total_amount: Decimal,
        creator_name: str,
        customer_name: str,
    ) -> None:
        """Legacy helper: persists logs, commits, and enqueues background tasks."""
        logs = cls.create_approval_request_logs(
            db, order_number, total_amount, creator_name, customer_name
        )
        db.commit()
        for log_id, to_email, subject, html_body in logs:
            if background_tasks:
                background_tasks.add_task(cls._send_smtp_email, to_email, subject, html_body, log_id)
            else:
                cls._send_smtp_email(to_email, subject, html_body, log_id)

    @classmethod
    def send_order_decision_to_creator(
        cls,
        db: Session,
        background_tasks,
        creator_email: str,
        creator_name: str,
        order_number: str,
        decision: str,
        comment: str,
        total_amount: Decimal,
    ) -> None:
        """Legacy helper: persists log, commits, and enqueues background task."""
        log_id, to_email, subject, html_body = cls.create_decision_log(
            db, creator_email, creator_name, order_number, decision, comment, total_amount
        )
        db.commit()
        if background_tasks:
            background_tasks.add_task(cls._send_smtp_email, to_email, subject, html_body, log_id)
        else:
            cls._send_smtp_email(to_email, subject, html_body, log_id)
