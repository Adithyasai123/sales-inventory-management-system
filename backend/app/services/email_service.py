import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.core.database import SessionLocal
from app.models.email_log import EmailLog, EmailStatus
from app.models.user import User, UserRole


class EmailService:
    @staticmethod
    def _send_smtp_email(to_email: str, subject: str, html_body: str, log_id: Optional[int] = None) -> bool:
        """Synchronously dispatch email to SMTP server (run inside BackgroundTasks)."""
        db = SessionLocal()
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

            logger.info(f"Email successfully sent to {to_email} | Subject: {subject}")
            
            if log_id:
                email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                if email_log:
                    email_log.status = EmailStatus.SENT
                    db.commit()
            return True

        except Exception as exc:
            error_msg = f"Failed to send email to {to_email}: {str(exc)}"
            logger.error(error_msg)
            if log_id:
                email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                if email_log:
                    email_log.status = EmailStatus.FAILED
                    email_log.error_message = error_msg
                    email_log.retries += 1
                    db.commit()
            return False
        finally:
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
        """Dispatches notification emails to all active MANAGER and ADMIN users when an order requires approval."""
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

                <p>Please log in to the <strong>Sales & Inventory Management System</strong> to inspect line items and submit your approval or rejection decision.</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #CFE7DC; font-size: 12px; color: #5B7A73;">
                    This is an automated system notification from SIMS.
                </div>
            </div>
        </body>
        </html>
        """

        for manager in managers:
            log = EmailLog(
                recipient=manager.email,
                subject=subject,
                body_preview=f"Order {order_number} (${total_amount:,.2f}) created by {creator_name} requires approval.",
                status=EmailStatus.PENDING,
            )
            db.add(log)
            db.flush()
            
            if background_tasks:
                background_tasks.add_task(cls._send_smtp_email, manager.email, subject, html_content, log.id)
            else:
                cls._send_smtp_email(manager.email, subject, html_content, log.id)

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
        """Dispatches notification email to the order creator informing them of the manager's decision."""
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

        if background_tasks:
            background_tasks.add_task(cls._send_smtp_email, creator_email, subject, html_content, log.id)
        else:
            cls._send_smtp_email(creator_email, subject, html_content, log.id)
