"""Backend runtime configuration."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
DEFAULT_MODEL_PATH = BACKEND_DIR / "yolov8n.pt"
CUSTOM_MODEL_PATH = BACKEND_DIR / "models" / "drink_detector.pt"
DEFAULT_DEBUG_DIR = BACKEND_DIR / "debug"
DEFAULT_STORAGE_DIR = BACKEND_DIR / "storage"
DEFAULT_MEDIA_DIR = DEFAULT_STORAGE_DIR / "media"
DEFAULT_SQLITE_PATH = BACKEND_DIR / "eventcapture.db"
DEFAULT_LOCAL_CORS_ORIGIN_REGEX = (
    r"^https?://("
    r"localhost|127\.0\.0\.1|"
    r"10\.\d+\.\d+\.\d+|"
    r"192\.168\.\d+\.\d+|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+"
    r")(:\d+)?$"
)


def _default_cors_origins() -> list[str]:
    return [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8081",
    ]


def _default_database_url() -> str:
    return f"sqlite+pysqlite:///{DEFAULT_SQLITE_PATH}"


class BackendSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="EVENTCAPTURE_",
        env_file=(".env", ".env.local", "backend/.env", "backend/.env.local"),
        extra="ignore",
    )

    environment: Literal["development", "staging", "production"] = "development"
    title: str = "EventCapture API"
    version: str = "2.0.0"
    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = Field(default_factory=_default_database_url)
    database_path: Path | None = None
    database_echo: bool = False
    schema_management_mode: Literal["auto", "validate"] | None = None

    auth_jwt_secret: str = "change-me-before-production"
    auth_jwt_algorithm: str = "HS256"
    auth_access_token_minutes: int = 60 * 24
    password_reset_code_minutes: int = 15

    cors_allowed_origins: list[str] = Field(default_factory=_default_cors_origins)
    cors_allow_origin_regex: str | None = None

    max_upload_bytes: int = 10 * 1024 * 1024
    upload_jpeg_quality: int = 85
    websocket_jpeg_quality: int = 75
    websocket_latest_frame_timeout_s: float = 0.001
    websocket_max_frame_edge: int = 1280
    inference_workers: int = 2
    max_concurrent_inference: int = 2
    require_inference_auth: bool | None = None

    media_backend: Literal["local", "s3"] = "local"
    media_root: Path = DEFAULT_MEDIA_DIR
    debug_dir: Path = DEFAULT_DEBUG_DIR
    media_url_base: str | None = None
    public_backend_url: str | None = None

    s3_bucket: str | None = None
    s3_region: str | None = None
    s3_endpoint_url: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_public_base_url: str | None = None

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_from_email: str | None = None
    app_public_url: str | None = None
    support_notification_emails: list[str] = Field(default_factory=list)
    support_confirmation_enabled: bool = False

    rate_limit_login_attempts: int = 50
    rate_limit_login_window_seconds: int = 300
    rate_limit_register_attempts: int = 100
    rate_limit_register_window_seconds: int = 3600
    rate_limit_password_reset_attempts: int = 20
    rate_limit_password_reset_window_seconds: int = 900
    rate_limit_support_attempts: int = 50
    rate_limit_support_window_seconds: int = 900
    rate_limit_search_attempts: int = 200
    rate_limit_search_window_seconds: int = 60
    rate_limit_event_social_attempts: int = 100
    rate_limit_event_social_window_seconds: int = 60

    bootstrap_users_enabled: bool = True
    bootstrap_admin_email: str = "admin"
    bootstrap_admin_password: str = "admin"
    bootstrap_admin_username: str = "admin"
    bootstrap_admin_full_name: str = "Admin User"
    bootstrap_admin_city: str = "Brussels"
    bootstrap_admin_bio: str = "Platform administrator."
    bootstrap_admin_avatar_uri: str = "https://i.pravatar.cc/160?img=68"

    bootstrap_demo_email: str = "demo@eventcapture.app"
    bootstrap_demo_password: str = "eventcapture123"
    bootstrap_demo_username: str = "eventfriend"
    bootstrap_demo_full_name: str = "Event Friend"
    bootstrap_demo_city: str = "Brussels"
    bootstrap_demo_bio: str = (
        "Capturing nights, collecting crowns and keeping the best event memories close."
    )
    bootstrap_demo_avatar_uri: str = "https://i.pravatar.cc/160?img=64"

    supported_drinks: tuple[str, ...] = (
        "Glass",
        "Cup",
        "Bottle",
        "Beverage Can",
        "Soft Drink Can",
        "Beer Can",
        "Energy Drink Can",
        "Drink Carton",
    )

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _parse_cors_allowed_origins(cls, value: object) -> object:
        if value is None or value == "":
            return []
        if isinstance(value, str):
            trimmed = value.strip()
            if not trimmed:
                return []
            if trimmed.startswith("["):
                parsed = json.loads(trimmed)
                if not isinstance(parsed, list):
                    raise ValueError("cors_allowed_origins JSON must be an array.")
                return parsed
            return [item.strip() for item in trimmed.split(",") if item.strip()]
        return value

    @field_validator("cors_allow_origin_regex", mode="before")
    @classmethod
    def _normalize_optional_regex(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, str):
            trimmed = value.strip()
            return trimmed or None
        return value

    @field_validator("support_notification_emails", mode="before")
    @classmethod
    def _parse_support_notification_emails(cls, value: object) -> object:
        if value is None or value == "":
            return []
        if isinstance(value, str):
            trimmed = value.strip()
            if not trimmed:
                return []
            if trimmed.startswith("["):
                parsed = json.loads(trimmed)
                if not isinstance(parsed, list):
                    raise ValueError("support_notification_emails JSON must be an array.")
                return [str(item).strip() for item in parsed if str(item).strip()]
            return [item.strip() for item in trimmed.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_local_media(self) -> bool:
        return self.media_backend == "local"

    @property
    def normalized_media_url_base(self) -> str | None:
        return self.media_url_base.rstrip("/") if self.media_url_base else None

    @property
    def effective_cors_allow_origin_regex(self) -> str | None:
        if self.cors_allow_origin_regex is not None:
            return self.cors_allow_origin_regex
        return None if self.is_production else DEFAULT_LOCAL_CORS_ORIGIN_REGEX

    @property
    def inference_auth_enabled(self) -> bool:
        if self.require_inference_auth is not None:
            return self.require_inference_auth
        return self.is_production

    @property
    def effective_inference_concurrency(self) -> int:
        return max(1, min(self.max_concurrent_inference, self.inference_workers))

    @property
    def effective_schema_management_mode(self) -> Literal["auto", "validate"]:
        if self.schema_management_mode is not None:
            return self.schema_management_mode
        return "validate" if self.is_production else "auto"

    @property
    def sqlite_fallback_url(self) -> str:
        return f"sqlite+pysqlite:///{DEFAULT_SQLITE_PATH}"

    @model_validator(mode="after")
    def _apply_database_path_override(self) -> "BackendSettings":
        if self.database_path is not None:
            self.database_url = f"sqlite+pysqlite:///{self.database_path}"
        return self

    def redacted_database_url(self) -> str:
        if "@" not in self.database_url:
            return self.database_url

        scheme, remainder = self.database_url.split("://", 1)
        if "@" not in remainder:
            return self.database_url

        credentials, host_part = remainder.split("@", 1)
        if ":" not in credentials:
            return self.database_url

        username, _password = credentials.split(":", 1)
        return f"{scheme}://{username}:***@{host_part}"

    def validate_runtime(self) -> None:
        issues: list[str] = []

        if self.inference_workers < 1:
            issues.append("EVENTCAPTURE_INFERENCE_WORKERS must be at least 1.")
        if self.max_concurrent_inference < 1:
            issues.append("EVENTCAPTURE_MAX_CONCURRENT_INFERENCE must be at least 1.")
        if self.max_upload_bytes < 1:
            issues.append("EVENTCAPTURE_MAX_UPLOAD_BYTES must be at least 1.")
        for field_name in (
            "rate_limit_login_attempts",
            "rate_limit_login_window_seconds",
            "rate_limit_register_attempts",
            "rate_limit_register_window_seconds",
            "rate_limit_password_reset_attempts",
            "rate_limit_password_reset_window_seconds",
            "rate_limit_support_attempts",
            "rate_limit_support_window_seconds",
            "rate_limit_search_attempts",
            "rate_limit_search_window_seconds",
            "rate_limit_event_social_attempts",
            "rate_limit_event_social_window_seconds",
        ):
            if int(getattr(self, field_name)) < 1:
                issues.append(f"{field_name} must be at least 1.")

        if self.is_production:
            if self.auth_jwt_secret == "change-me-before-production":
                issues.append("EVENTCAPTURE_AUTH_JWT_SECRET must be set in production.")
            if self.effective_schema_management_mode == "auto":
                issues.append(
                    "Production requires EVENTCAPTURE_SCHEMA_MANAGEMENT_MODE=validate and managed migrations."
                )
            if not self.cors_allowed_origins and not self.effective_cors_allow_origin_regex:
                issues.append(
                    "Production requires EVENTCAPTURE_CORS_ALLOWED_ORIGINS or EVENTCAPTURE_CORS_ALLOW_ORIGIN_REGEX."
                )
            if self.bootstrap_users_enabled and self.bootstrap_admin_password == "admin":
                issues.append(
                    "Disable bootstrap users or override EVENTCAPTURE_BOOTSTRAP_ADMIN_PASSWORD in production."
                )
            if self.bootstrap_users_enabled and self.bootstrap_demo_password == "eventcapture123":
                issues.append(
                    "Disable bootstrap users or override EVENTCAPTURE_BOOTSTRAP_DEMO_PASSWORD in production."
                )
            if not self.support_notification_emails:
                issues.append("EVENTCAPTURE_SUPPORT_NOTIFICATION_EMAILS must be configured in production.")

        if issues:
            raise ValueError("Invalid backend configuration:\n- " + "\n- ".join(issues))


settings = BackendSettings()
