"""SMTP delivery helpers for EventCapture transactional mail."""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage

try:
    from .config import settings
except ImportError:
    from config import settings


logger = logging.getLogger(__name__)


def _smtp_delivery_ready() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def _send_message(message: EmailMessage) -> None:
    if not _smtp_delivery_ready():
        raise RuntimeError("SMTP delivery is not configured.")

    context = ssl.create_default_context()
    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(str(settings.smtp_host), settings.smtp_port, context=context, timeout=15) as server:
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
        return

    with smtplib.SMTP(str(settings.smtp_host), settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls(context=context)
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


def password_reset_delivery_ready() -> bool:
    return _smtp_delivery_ready()


def send_password_reset_email(*, recipient: str, reset_token: str, expires_minutes: int) -> None:
    message = EmailMessage()
    message["Subject"] = "Reset your EventCapture password"
    message["From"] = str(settings.smtp_from_email)
    message["To"] = recipient
    message.set_content(
        "\n".join(
            [
                "A password reset was requested for your EventCapture account.",
                "",
                f"Use this reset token within {expires_minutes} minutes:",
                reset_token,
                "",
                "If you did not request this change, you can ignore this message.",
            ]
        )
    )
    _send_message(message)


def support_delivery_ready() -> bool:
    return _smtp_delivery_ready() and bool(settings.support_notification_emails)


def send_support_ticket_notification(
    *,
    ticket_id: str,
    requester_email: str,
    subject: str,
    message: str,
    priority: str,
) -> None:
    recipients = list(settings.support_notification_emails)
    if not recipients:
        raise RuntimeError("Support notification email recipients are not configured.")

    outbound = EmailMessage()
    outbound["Subject"] = f"[EventCapture Support] {ticket_id} {subject}"
    outbound["From"] = str(settings.smtp_from_email)
    outbound["To"] = ", ".join(recipients)
    outbound.set_content(
        "\n".join(
            [
                f"Ticket ID: {ticket_id}",
                f"Priority: {priority}",
                f"Requester email: {requester_email}",
                "",
                message,
            ]
        )
    )
    _send_message(outbound)


def send_support_ticket_confirmation(
    *,
    recipient: str,
    ticket_id: str,
    subject: str,
) -> None:
    if not settings.support_confirmation_enabled:
        return

    confirmation = EmailMessage()
    confirmation["Subject"] = f"We received your EventCapture support request ({ticket_id})"
    confirmation["From"] = str(settings.smtp_from_email)
    confirmation["To"] = recipient
    confirmation.set_content(
        "\n".join(
            [
                "Your EventCapture support request has been received.",
                f"Reference: {ticket_id}",
                f"Subject: {subject}",
                "",
                "Our team will review it and follow up as needed.",
            ]
        )
    )
    _send_message(confirmation)


def log_dev_reset_token(email: str, reset_token: str) -> None:
    logger.info("Development password reset token generated for %s", email)


def log_support_delivery_skip(ticket_id: str, reason: str) -> None:
    logger.warning("Support ticket %s saved but email notification was skipped: %s", ticket_id, reason)

