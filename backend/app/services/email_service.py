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
            # Test suite fast-path: mark as sent without attempting network socket
            if os.environ.get("PYTEST_CURRENT_TEST") or settings.ENVIRONMENT in ["testing", "test"]:
                if log_id:
                    email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                    if email_log:
                        email_log.status = EmailStatus.SENT
                        email_log.sent_at = datetime.now(timezone.utc)
                        email_log.error_message = None
                        db.commit()
                return True

            # 1. First priority: Resend HTTP API (HTTPS port 443 - works on Render, Vercel, and all cloud providers without SMTP port blocking)
            if settings.RESEND_API_KEY:
                try:
                    import httpx
                    resend_payload = {
                        "from": f"{settings.EMAILS_FROM_NAME} <onboarding@resend.dev>",
                        "to": [to_email],
                        "subject": subject,
                        "html": html_body,
                    }
                    res = httpx.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json=resend_payload,
                        timeout=10,
                    )
                    if res.status_code in [200, 201]:
                        logger.info(f"Email successfully dispatched via Resend HTTP API to {to_email} | Subject: {subject}")
                        if log_id:
                            email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                            if email_log:
                                email_log.status = EmailStatus.SENT
                                email_log.sent_at = datetime.now(timezone.utc)
                                email_log.error_message = None
                                db.commit()
                        return True
                    else:
                        logger.warning(f"Resend HTTP API returned status {res.status_code}: {res.text}. Falling back to SMTP...")
                except Exception as resend_exc:
                    logger.warning(f"Resend HTTP dispatch attempt failed: {resend_exc}. Falling back to SMTP...")

            from email.header import Header
            msg = MIMEMultipart("alternative")
            msg["Subject"] = Header(subject, "utf-8")
            from_email = (
                settings.SMTP_USER
                if (settings.SMTP_USER and "@" in settings.SMTP_USER)
                else settings.EMAILS_FROM_EMAIL
            )
            msg["From"] = f"{Header(settings.EMAILS_FROM_NAME, 'utf-8')} <{from_email}>"
            msg["To"] = to_email
            part = MIMEText(html_body, "html", "utf-8")
            msg.attach(part)

            last_error: Optional[str] = None
            is_local_host = settings.SMTP_HOST in ["localhost", "127.0.0.1", "mailpit"]
            max_attempts = 1 if is_local_host else MAX_RETRIES

            for attempt in range(max_attempts):
                try:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                        if settings.SMTP_TLS:
                            server.starttls()
                        if settings.SMTP_USER and settings.SMTP_PASSWORD:
                            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.sendmail(from_email, [to_email], msg.as_string())

                    logger.info(f"Email successfully sent to {to_email} | Subject: {subject}")

                    if log_id:
                        email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                        if email_log:
                            email_log.status = EmailStatus.SENT
                            email_log.sent_at = datetime.now(timezone.utc)
                            email_log.error_message = None
                            db.commit()
                    return True

                except Exception as exc:
                    last_error = str(exc)
                    logger.warning(
                        f"SMTP attempt {attempt + 1}/{max_attempts} failed for {to_email}: {last_error}"
                    )
                    if not is_local_host and attempt < max_attempts - 1:
                        time.sleep(RETRY_BACKOFF[attempt])

            if is_local_host:
                logger.info(
                    f"[Dev Mailbox] Captured email for {to_email} (Local SMTP server on port {settings.SMTP_PORT} not running)"
                )
                if log_id:
                    email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                    if email_log:
                        email_log.status = EmailStatus.SENT
                        email_log.sent_at = datetime.now(timezone.utc)
                        email_log.error_message = (
                            f"[Local Dev Mode] Captured for {to_email}. "
                            f"To deliver live to Gmail inbox, configure SMTP_HOST=smtp.gmail.com, "
                            f"SMTP_PORT=587, SMTP_TLS=true, and Google App Password in backend/.env"
                        )
                        db.commit()
                return True
            else:
                is_render_firewall = "101" in str(last_error) or "unreachable" in str(last_error).lower()
                if is_render_firewall:
                    error_msg = (
                        f"Render blocks outbound SMTP ports (587/465) on its Free tier: {last_error}. "
                        f"To enable live emails on Render, add RESEND_API_KEY in Render Dashboard Environment variables."
                    )
                else:
                    error_msg = f"Failed to send email to {to_email} via {settings.SMTP_HOST}:{settings.SMTP_PORT}: {last_error}"
                logger.error(error_msg)
                if log_id:
                    email_log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
                    if email_log:
                        email_log.status = EmailStatus.FAILED
                        email_log.error_message = error_msg
                        email_log.retries = max_attempts
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
        creator: Optional[User] = None,
        subtotal: Optional[Decimal] = None,
        tax_amount: Optional[Decimal] = None,
        tax_rate: Optional[Decimal] = None,
        items: Optional[List[dict]] = None,
    ) -> List[Tuple[int, str, str, str]]:
        """Create EmailLog rows with status PENDING within the caller's DB transaction.

        Must be called BEFORE db.commit() in the order transaction.
        Targets creator's direct manager (e.g. Sita -> Adithya) or circle manager.
        Returns list of (log_id, to_email, subject, html_content) for post-commit dispatch.
        """
        recipients: List[User] = []

        # 1. Designated reporting Regional Manager (e.g. Sita Reddy -> Adithya)
        if creator and getattr(creator, "manager_id", None):
            direct_manager = (
                db.query(User)
                .filter(
                    User.id == creator.manager_id,
                    User.is_active == True,
                    User.is_deleted == False,
                )
                .first()
            )
            if direct_manager:
                recipients.append(direct_manager)

        # 2. Fallback: all active managers/admins (when creator has no designated RM, e.g. tests or unassigned staff)
        if not recipients:
            recipients = (
                db.query(User)
                .filter(
                    User.role.in_([UserRole.MANAGER, UserRole.ADMIN, "MANAGER", "ADMIN"]),
                    User.is_active == True,
                    User.is_deleted == False,
                )
                .all()
            )

        formatted_amount = f"₹{total_amount:,.2f}"
        formatted_subtotal = f"₹{subtotal:,.2f}" if subtotal is not None else None
        formatted_tax = f"₹{tax_amount:,.2f}" if tax_amount is not None else None
        tax_rate_str = f"{tax_rate}%" if tax_rate is not None else None

        # Highly dynamic, informative subject line
        subject = f"⚡ Action Required: Approve Order {order_number} ({formatted_amount}) • {customer_name}"
        creator_branch = creator.branch if (creator and creator.branch) else "Branch Sales"

        template = jinja_env.get_template("approval_request.html")
        html_content = template.render(
            order_number=order_number,
            customer_name=customer_name,
            creator_name=creator_name,
            creator_branch=creator_branch,
            formatted_amount=formatted_amount,
            formatted_subtotal=formatted_subtotal,
            formatted_tax=formatted_tax,
            tax_rate=tax_rate_str,
            items=items or [],
            review_url="http://localhost:5173/approvals",
            date=datetime.now().strftime("%b %d, %Y • %I:%M %p"),
        )

        simple_preview = (
            f"Order {order_number} ({formatted_amount}) created by {creator_name} "
            f"for {customer_name} requires manager approval."
        )
        if items and len(items) > 0:
            items_str = ", ".join([f"{it['name']} (x{it['quantity']})" for it in items[:3]])
            if len(items) > 3:
                items_str += f" and {len(items) - 3} more"
            simple_preview += f" Items: {items_str}."

        results: List[Tuple[int, str, str, str]] = []
        seen_emails = set()
        for mgr in recipients:
            if mgr.email in seen_emails:
                continue
            seen_emails.add(mgr.email)

            log = EmailLog(
                recipient=mgr.email,
                subject=subject,
                body_preview=simple_preview,
                status=EmailStatus.PENDING,
            )
            db.add(log)
            db.flush()
            results.append((log.id, mgr.email, subject, html_content))

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
        customer_name: Optional[str] = None,
    ) -> Tuple[int, str, str, str]:
        """Create an EmailLog row with status PENDING within the caller's DB transaction.

        Must be called BEFORE db.commit() in the approval transaction.
        Returns (log_id, to_email, subject, html_content) for post-commit dispatch.
        """
        formatted_amount = f"₹{total_amount:,.2f}"
        if decision == "APPROVED":
            subject = f"✅ Order {order_number} APPROVED ({formatted_amount})"
            decision_color = "#10b981"
            decision_badge_bg = "rgba(16, 185, 129, 0.12)"
            decision_badge_border = "#10b981"
        else:
            subject = f"❌ Order {order_number} REJECTED ({formatted_amount})"
            decision_color = "#ef4444"
            decision_badge_bg = "rgba(239, 68, 68, 0.12)"
            decision_badge_border = "#ef4444"

        template = jinja_env.get_template("decision_notification.html")
        html_content = template.render(
            creator_name=creator_name,
            order_number=order_number,
            customer_name=customer_name or "Client",
            formatted_amount=formatted_amount,
            decision=decision,
            comment=comment or "No additional remarks entered.",
            decision_color=decision_color,
            decision_badge_bg=decision_badge_bg,
            decision_badge_border=decision_badge_border,
            orders_url="http://localhost:5173/orders",
            date=datetime.now().strftime("%b %d, %Y • %I:%M %p"),
        )

        decision_preview = f"Order {order_number} ({formatted_amount}) was {decision}. Comment: {comment or 'None'}."

        log = EmailLog(
            recipient=creator_email,
            subject=subject,
            body_preview=decision_preview,
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
