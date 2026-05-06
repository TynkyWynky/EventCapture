"""Media storage helpers with local filesystem and S3 support."""

from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Final
from urllib.parse import urljoin

import boto3
from botocore.config import Config as BotoConfig
from fastapi import Request

try:
    from .config import settings
except ImportError:
    from config import settings


LOCAL_MEDIA_MOUNT_NAME: Final[str] = "media"


@dataclass(frozen=True)
class StoredMedia:
    storage_path: str


class StorageService:
    def __init__(self) -> None:
        self._s3_client = None
        if settings.media_backend == "s3":
            if not settings.s3_bucket:
                raise RuntimeError("EVENTCAPTURE_S3_BUCKET is required when media backend is s3.")

            self._s3_client = boto3.client(
                "s3",
                region_name=settings.s3_region,
                endpoint_url=settings.s3_endpoint_url,
                aws_access_key_id=settings.s3_access_key_id,
                aws_secret_access_key=settings.s3_secret_access_key,
                config=BotoConfig(signature_version="s3v4"),
            )

    def ensure_ready(self) -> None:
        if settings.is_local_media:
            settings.media_root.mkdir(parents=True, exist_ok=True)
            return

        # This call validates connectivity early without mutating bucket state.
        assert self._s3_client is not None
        self._s3_client.head_bucket(Bucket=settings.s3_bucket)

    def save_capture_assets(
        self,
        capture_id: str,
        *,
        original_bytes: bytes,
        annotated_bytes: bytes,
    ) -> tuple[StoredMedia, StoredMedia]:
        base_path = f"captures/{capture_id}"
        original = self.save_bytes(
            f"{base_path}/original.jpg",
            original_bytes,
            content_type="image/jpeg",
        )
        annotated = self.save_bytes(
            f"{base_path}/annotated.jpg",
            annotated_bytes,
            content_type="image/jpeg",
        )
        return original, annotated

    def save_avatar(
        self,
        user_id: str,
        *,
        content: bytes,
        filename: str | None,
        content_type: str | None,
    ) -> StoredMedia:
        extension = self._infer_extension(filename=filename, content_type=content_type)
        return self.save_bytes(
            f"avatars/{user_id}/{user_id}{extension}",
            content,
            content_type=content_type or "application/octet-stream",
        )

    def save_bytes(
        self,
        storage_path: str,
        content: bytes,
        *,
        content_type: str,
    ) -> StoredMedia:
        normalized_path = storage_path.replace("\\", "/").lstrip("/")

        if settings.is_local_media:
            absolute_path = settings.media_root / normalized_path
            absolute_path.parent.mkdir(parents=True, exist_ok=True)
            absolute_path.write_bytes(content)
            return StoredMedia(storage_path=normalized_path)

        assert self._s3_client is not None
        self._s3_client.put_object(
            Bucket=settings.s3_bucket,
            Key=normalized_path,
            Body=content,
            ContentType=content_type,
        )
        return StoredMedia(storage_path=normalized_path)

    def build_public_url(self, request: Request | None, storage_path: str) -> str:
        normalized_path = storage_path.replace("\\", "/").lstrip("/")

        if settings.is_local_media:
            if settings.normalized_media_url_base:
                return f"{settings.normalized_media_url_base}/{normalized_path}"
            if request is None:
                raise RuntimeError("A request context is required to build local media URLs.")
            return str(request.url_for(LOCAL_MEDIA_MOUNT_NAME, path=normalized_path))

        if settings.s3_public_base_url:
            return f"{settings.s3_public_base_url.rstrip('/')}/{normalized_path}"

        assert self._s3_client is not None
        return self._s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.s3_bucket, "Key": normalized_path},
            ExpiresIn=3600,
        )

    def is_local_path(self, value: str | None) -> bool:
        if not value:
            return False
        return not value.startswith(("http://", "https://"))

    def _infer_extension(self, *, filename: str | None, content_type: str | None) -> str:
        if filename:
            suffix = Path(filename).suffix.lower()
            if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
                return suffix

        if content_type:
            guessed = mimetypes.guess_extension(content_type, strict=False)
            if guessed:
                return ".jpg" if guessed == ".jpe" else guessed

        return ".jpg"
