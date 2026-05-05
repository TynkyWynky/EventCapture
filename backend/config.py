"""Backend runtime configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _env_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return int(raw_value)
    except ValueError:
        return default


def _env_float(name: str, default: float) -> float:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        return float(raw_value)
    except ValueError:
        return default


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
CUSTOM_MODEL_PATH = BACKEND_DIR / "models" / "drink_detector.pt"
DEFAULT_MODEL_PATH = BACKEND_DIR / "yolov8n.pt"
DEBUG_DIR = BACKEND_DIR / "debug"
STORAGE_DIR = BACKEND_DIR / "storage"
MEDIA_DIR = STORAGE_DIR / "media"
DATABASE_PATH = Path(os.getenv("EVENTCAPTURE_DATABASE_PATH", str(BACKEND_DIR / "eventcapture.db")))


@dataclass(frozen=True)
class BackendSettings:
    title: str
    version: str
    environment: str
    debug: bool
    model_name: str
    host: str
    port: int
    max_upload_bytes: int
    upload_jpeg_quality: int
    websocket_jpeg_quality: int
    websocket_latest_frame_timeout_s: float
    secret_key: str
    session_ttl_hours: int
    allowed_origins: tuple[str, ...]
    allow_insecure_password_reset: bool
    expose_dev_reset_token: bool
    password_reset_token_ttl_minutes: int
    support_email_to: str | None
    reset_email_from: str | None
    smtp_host: str | None
    smtp_port: int
    smtp_username: str | None
    smtp_password: str | None
    smtp_use_tls: bool
    smtp_use_ssl: bool
    supported_drinks: tuple[str, ...]


def _load_settings() -> BackendSettings:
    default_allowed_origins = "http://localhost:8081,http://localhost:19006,http://127.0.0.1:8081,http://127.0.0.1:19006"
    configured_origins = os.getenv("EVENTCAPTURE_ALLOWED_ORIGINS", default_allowed_origins)

    return BackendSettings(
        title="EventCapture API",
        version=os.getenv("EVENTCAPTURE_VERSION", "2.0.0"),
        environment=os.getenv("EVENTCAPTURE_ENV", "development"),
        debug=_env_bool("EVENTCAPTURE_DEBUG", True),
        model_name="YOLOv8n",
        host=os.getenv("EVENTCAPTURE_HOST", "0.0.0.0"),
        port=_env_int("EVENTCAPTURE_PORT", 8000),
        max_upload_bytes=_env_int("EVENTCAPTURE_MAX_UPLOAD_BYTES", 10 * 1024 * 1024),
        upload_jpeg_quality=_env_int("EVENTCAPTURE_UPLOAD_JPEG_QUALITY", 85),
        websocket_jpeg_quality=_env_int("EVENTCAPTURE_WEBSOCKET_JPEG_QUALITY", 75),
        websocket_latest_frame_timeout_s=_env_float("EVENTCAPTURE_WS_LATEST_FRAME_TIMEOUT_S", 0.001),
        secret_key=os.getenv("EVENTCAPTURE_SECRET_KEY", "change-me-for-production"),
        session_ttl_hours=_env_int("EVENTCAPTURE_SESSION_TTL_HOURS", 24 * 14),
        allowed_origins=tuple(origin.strip() for origin in configured_origins.split(",") if origin.strip()),
        allow_insecure_password_reset=_env_bool("EVENTCAPTURE_ALLOW_INSECURE_PASSWORD_RESET", True),
        expose_dev_reset_token=_env_bool("EVENTCAPTURE_EXPOSE_DEV_RESET_TOKEN", True),
        password_reset_token_ttl_minutes=_env_int("EVENTCAPTURE_PASSWORD_RESET_TOKEN_TTL_MINUTES", 30),
        support_email_to=os.getenv("EVENTCAPTURE_SUPPORT_EMAIL_TO"),
        reset_email_from=os.getenv("EVENTCAPTURE_RESET_EMAIL_FROM"),
        smtp_host=os.getenv("EVENTCAPTURE_SMTP_HOST"),
        smtp_port=_env_int("EVENTCAPTURE_SMTP_PORT", 587),
        smtp_username=os.getenv("EVENTCAPTURE_SMTP_USERNAME"),
        smtp_password=os.getenv("EVENTCAPTURE_SMTP_PASSWORD"),
        smtp_use_tls=_env_bool("EVENTCAPTURE_SMTP_USE_TLS", True),
        smtp_use_ssl=_env_bool("EVENTCAPTURE_SMTP_USE_SSL", False),
        supported_drinks=(
            "Water",
            "Coffee",
            "Tea",
            "Soda",
            "Beer",
            "Wine",
            "Juice",
            "Energy Drink",
        ),
    )


settings = _load_settings()
