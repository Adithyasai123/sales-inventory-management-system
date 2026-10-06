import smtplib
import time
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.core.database import SessionLocal
from app.models.email_log import EmailLog, EmailStatus
from app.models.user import User, UserRole

MAX_RETRIES = 3
RETRY_BACKOFF = [1, 2, 4]  # seconds between retries


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
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #E9F6F0; padding: 24px; color: #0F2E2A;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #CFE7DC; padding: 32px;">
                <h2 style="color: #0F2E2A; margin-top: 0;">Sales Order Approval Required</h2>
                <p>Hello Manager,</p>
                <p>A new high-value sales order has been created that exceeds the required threshold and awaits your approval:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #F1FAF6; border-radius: 12px; padding: 16px;">
                    <tr><td style="padding: 8px; font-weight: bold;">Order Number:</td><td style="padding: 8px; font-family: monospace;">{order_number}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Customer:</td><td style="padding: 8px;">{customer_name}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Created By:</td><td style="padding: 8px;">{creator_name}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Total Amount:</td><td style="padding: 8px; font-weight: bold; color: #0F3D33;">${total_amount:,.2f}</td></tr>
                </table>

                <p>Please log in to the <strong>Sales &amp; Inventory Management System</strong> to inspect line items and submit your approval or rejection decision.</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #CFE7DC; font-size: 12px; color: #5B7A73;">
                    This is an automated system notification from SIMS.
                </div>
            </div>
        </body>
        </html>
        """

        results: List[Tuple[int, str, str, str]] = []
        for manager in managers:
            log = EmailLog(
                recipient=manager.email,
                subject=subject,
                body_preview=f"Order {order_number} (${total_amount:,.2f}) created by {creator_name} requires approval.",
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

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #E9F6F0; padding: 24px; color: #0F2E2A;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #CFE7DC; padding: 32px;">
                <h2 style="color: #0F2E2A; margin-top: 0;">Order Status Update</h2>
                <p>Hello {creator_name},</p>
                <p>Your sales order <strong>{order_number}</strong> (${total_amount:,.2f}) has been reviewed by management:</p>
                
                <div style="background: #F1FAF6; border-left: 4px solid {decision_color}; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;">Decision: <strong style="color: {decision_color};">{decision}</strong></p>
                    <p style="margin: 8px 0 0 0; color: #5B7A73; font-style: italic;">Manager Comment: "{comment}"</p>
                </div>

                <p>{'The inventory has been deducted and the order is marked as COMPLETED.' if decision == 'APPROVED' else 'The order has been REJECTED and no inventory was altered.'}</p>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #CFE7DC; font-size: 12px; color: #5B7A73;">
                    This is an automated system notification from SIMS.
                </div>
            </div>
        </body>
        </html>
        """

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
