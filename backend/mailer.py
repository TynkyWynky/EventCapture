"""Password-reset delivery helpers."""

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


def password_reset_delivery_ready() -> bool:
    return bool(settings.smtp_host and settings.reset_email_from)


def send_password_reset_email(*, recipient: str, reset_token: str, expires_minutes: int) -> None:
    if not password_reset_delivery_ready():
        raise RuntimeError("Password reset delivery is not configured.")

    message = EmailMessage()
    message["Subject"] = "Reset your EventCapture password"
    message["From"] = str(settings.reset_email_from)
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


def log_dev_reset_token(email: str, reset_token: str) -> None:
    logger.info("Development password reset token generated for %s", email)
