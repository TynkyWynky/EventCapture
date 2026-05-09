"""Authentication and security helpers."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

try:
    from .config import settings
except ImportError:
    from config import settings


_BCRYPT_SHA256_PREFIX = "bcrypt_sha256$"
_BCRYPT_ROUNDS = 12


def _normalize_password(password: str) -> bytes:
    # Pre-hash before bcrypt so long UTF-8 passwords stay supported.
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")


def hash_password(password: str) -> str:
    password_hash = bcrypt.hashpw(_normalize_password(password), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS))
    return _BCRYPT_SHA256_PREFIX + password_hash.decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith(_BCRYPT_SHA256_PREFIX):
        normalized_hash = password_hash.removeprefix(_BCRYPT_SHA256_PREFIX).encode("ascii")
        return bcrypt.checkpw(_normalize_password(password), normalized_hash)

    if password_hash.startswith("pbkdf2_sha256$"):
        try:
            _algorithm, iterations, salt_b64, digest_b64 = password_hash.split("$", 3)
            derived = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                base64.b64decode(salt_b64),
                int(iterations),
            )
            return hmac.compare_digest(base64.b64encode(derived).decode("ascii"), digest_b64)
        except (ValueError, TypeError):
            return False

    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False


def password_hash_needs_upgrade(password_hash: str) -> bool:
    return not password_hash.startswith(_BCRYPT_SHA256_PREFIX)


def create_access_token(subject: str, role: str) -> str:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.auth_access_token_minutes)
    payload = {
        "sub": subject,
        "role": role,
        "jti": uuid.uuid4().hex,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(
        payload,
        settings.auth_jwt_secret,
        algorithm=settings.auth_jwt_algorithm,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.auth_jwt_secret,
        algorithms=[settings.auth_jwt_algorithm],
    )


def generate_reset_code(length: int = 6) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def password_reset_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=settings.password_reset_code_minutes)
