"""
FastAPI server with authenticated app data APIs, Postgres-ready persistence,
configurable media storage, and concurrency-safe detection flows.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import smtplib
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from email.message import EmailMessage
from functools import partial
from pathlib import Path

import cv2
import jwt
import numpy as np
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles

try:
    from .api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from .config import CUSTOM_MODEL_PATH, DEFAULT_MODEL_PATH, FRONTEND_DIR, settings
    from .database import (
        PasswordResetRequestResult,
        add_post_comment,
        authenticate_user,
        change_user_password,
        check_database_connection,
        confirm_password_reset,
        create_capture,
        create_password_reset_request,
        create_user,
        delete_event,
        delete_post,
        delete_user,
        get_user_by_id,
        init_database,
        list_captures,
        list_events,
        list_posts,
        toggle_post_like,
        update_user_profile,
        upsert_event,
        upsert_post,
    )
    from .detector import DebugRegions, DetectorSessionState, DrinkDetector
    from .schemas import (
        AddPostCommentRequest,
        AnalyzeCaptureResponse,
        AppUserResponse,
        AuthChangePasswordRequest,
        AuthLoginRequest,
        AuthSessionResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DeleteResponse,
        DetectImageResponse,
        EventPayload,
        HealthResponse,
        PasswordResetChallengeResponse,
        PasswordResetConfirmRequest,
        PasswordResetConfirmResponse,
        PasswordResetRequest,
        PostPayload,
        StatusResponse,
        TogglePostLikeRequest,
        UserProfileResponse,
    )
    from .security import create_access_token, decode_access_token
    from .storage import LOCAL_MEDIA_MOUNT_NAME, StorageService
except ImportError:
    from api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from config import CUSTOM_MODEL_PATH, DEFAULT_MODEL_PATH, FRONTEND_DIR, settings
    from database import (
        PasswordResetRequestResult,
        add_post_comment,
        authenticate_user,
        change_user_password,
        check_database_connection,
        confirm_password_reset,
        create_capture,
        create_password_reset_request,
        create_user,
        delete_event,
        delete_post,
        delete_user,
        get_user_by_id,
        init_database,
        list_captures,
        list_events,
        list_posts,
        toggle_post_like,
        update_user_profile,
        upsert_event,
        upsert_post,
    )
    from detector import DebugRegions, DetectorSessionState, DrinkDetector
    from schemas import (
        AddPostCommentRequest,
        AnalyzeCaptureResponse,
        AppUserResponse,
        AuthChangePasswordRequest,
        AuthLoginRequest,
        AuthSessionResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DeleteResponse,
        DetectImageResponse,
        EventPayload,
        HealthResponse,
        PasswordResetChallengeResponse,
        PasswordResetConfirmRequest,
        PasswordResetConfirmResponse,
        PasswordResetRequest,
        PostPayload,
        StatusResponse,
        TogglePostLikeRequest,
        UserProfileResponse,
    )
    from security import create_access_token, decode_access_token
    from storage import LOCAL_MEDIA_MOUNT_NAME, StorageService


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)
storage_service = StorageService()
settings.validate_runtime()

if settings.is_local_media:
    settings.media_root.mkdir(parents=True, exist_ok=True)
settings.debug_dir.mkdir(parents=True, exist_ok=True)

last_debug_snapshot = DebugSnapshotResponse()
last_debug_snapshot_lock = threading.Lock()
detector_runtime = threading.local()
inference_executor = ThreadPoolExecutor(
    max_workers=settings.inference_workers,
    thread_name_prefix="eventcapture-inference",
)
inference_semaphore = asyncio.Semaphore(settings.effective_inference_concurrency)


def _create_detector() -> DrinkDetector:
    return DrinkDetector(
        model_path=str(DEFAULT_MODEL_PATH),
        custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
    )


def _get_detector() -> DrinkDetector:
    detector = getattr(detector_runtime, "detector", None)
    if detector is None:
        detector = _create_detector()
        detector_runtime.detector = detector
    return detector


def _get_last_debug_snapshot() -> DebugSnapshotResponse:
    with last_debug_snapshot_lock:
        return last_debug_snapshot.model_copy(deep=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await asyncio.to_thread(storage_service.ensure_ready)
    await asyncio.to_thread(init_database)
    try:
        yield
    finally:
        inference_executor.shutdown(wait=True, cancel_futures=False)


app = FastAPI(title=settings.title, version=settings.version, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_origin_regex=settings.effective_cors_allow_origin_regex,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

if settings.is_local_media:
    app.mount("/media", StaticFiles(directory=settings.media_root), name=LOCAL_MEDIA_MOUNT_NAME)


def _status_database_ok() -> bool:
    try:
        return check_database_connection()
    except Exception:
        logger.exception("Database health check failed.")
        return False


def _save_debug_artifacts(
    frame: np.ndarray,
    annotated: np.ndarray,
    debug_regions: DebugRegions,
    detections: list,
    source: str,
) -> None:
    global last_debug_snapshot

    frame_path = settings.debug_dir / "latest_frame.jpg"
    annotated_path = settings.debug_dir / "latest_annotated.jpg"
    cv2.imwrite(str(frame_path), frame)
    cv2.imwrite(str(annotated_path), annotated)

    with last_debug_snapshot_lock:
        last_debug_snapshot = DebugSnapshotResponse(
            source=source,
            frame_size=[int(frame.shape[1]), int(frame.shape[0])],
            detection_count=len(detections),
            person_count=len(debug_regions.persons),
            face_count=len(debug_regions.faces),
            head_zone_count=len(debug_regions.head_zones),
            saved_frame=str(frame_path),
            saved_annotated=str(annotated_path),
            updated_at=time.time(),
        )


def _build_status_response() -> StatusResponse:
    return StatusResponse(
        status="running",
        model="YOLOv8n",
        model_path=str(DEFAULT_MODEL_PATH),
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model=CUSTOM_MODEL_PATH.exists(),
        custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
        drink_classes=list(settings.supported_drinks),
        database_url=settings.redacted_database_url(),
        media_backend=settings.media_backend,
        media_root=str(settings.media_root),
        environment=settings.environment,
    )


def _decode_image(contents: bytes) -> np.ndarray | None:
    nparr = np.frombuffer(contents, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def _encode_jpeg_bytes(image: np.ndarray, quality: int) -> bytes:
    success, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not success:
        raise RuntimeError("Failed to encode image.")
    return buffer.tobytes()


def _resolve_avatar_uri(request: Request, avatar_uri: str) -> str:
    if not avatar_uri:
        return avatar_uri
    if avatar_uri.startswith(("http://", "https://")):
        return avatar_uri
    return storage_service.build_public_url(request, avatar_uri)


def _build_media_url(request: Request, relative_path: str) -> str:
    if relative_path.startswith(("http://", "https://")):
        return relative_path
    return storage_service.build_public_url(request, relative_path)


def _serialize_user_profile_response(request: Request, user: dict[str, object]) -> UserProfileResponse:
    return UserProfileResponse(
        id=str(user["id"]),
        username=str(user["username"]),
        avatar_uri=_resolve_avatar_uri(request, str(user["avatar_uri"])),
        full_name=str(user["full_name"]),
        bio=str(user["bio"]),
        city=str(user["city"]),
        email=str(user["email"]),
        role=str(user["role"]),
    )


def _serialize_capture_response(request: Request, capture: dict[str, object]) -> CaptureRecordResponse:
    return CaptureRecordResponse(
        id=str(capture["id"]),
        username=capture.get("username"),
        event_id=capture.get("event_id"),
        event_title=capture.get("event_title"),
        original_image_url=_build_media_url(request, str(capture["original_media_path"])),
        annotated_image_url=_build_media_url(request, str(capture["annotated_media_path"])),
        source=str(capture["source"]),
        created_at=str(capture["created_at"]),
    )


def _serialize_capture_list_item(request: Request, capture: dict[str, object]) -> CaptureListItemResponse:
    base = _serialize_capture_response(request, capture).model_dump()
    return CaptureListItemResponse(
        **base,
        status_label=str(capture["status_label"]),
        headline=str(capture["headline"]),
        message=str(capture["message"]),
        has_detections=bool(capture["has_detections"]),
        has_drinking_action=bool(capture["has_drinking_action"]),
        contains_beer=bool(capture["contains_beer"]),
        crown_eligible=bool(capture["crown_eligible"]),
        drink_count=int(capture["drink_count"]),
        drink_types=list(capture.get("drink_types", [])),
        top_drink=capture.get("top_drink"),
        top_confidence=capture.get("top_confidence"),
    )


def _serialize_post_payload(request: Request, post: dict[str, object]) -> PostPayload:
    return PostPayload(
        id=str(post["id"]),
        user=AppUserResponse(
            id=str(post["user"]["id"]),
            username=str(post["user"]["username"]),
            avatar_uri=_resolve_avatar_uri(request, str(post["user"]["avatar_uri"])),
        ),
        image_uri=str(post["image_uri"]),
        date=str(post["date"]),
        is_beer_finished=bool(post["is_beer_finished"]),
        event_id=post.get("event_id"),
        event_title=post.get("event_title"),
        likes=list(post.get("likes", [])),
        comments=[
            {
                "id": str(comment["id"]),
                "user": {
                    "id": str(comment["user"]["id"]),
                    "username": str(comment["user"]["username"]),
                    "avatar_uri": _resolve_avatar_uri(request, str(comment["user"]["avatar_uri"])),
                },
                "text": str(comment["text"]),
                "time": str(comment["time"]),
            }
            for comment in post.get("comments", [])
        ],
        capture_id=post.get("capture_id"),
    )


def _run_image_analysis(
    frame: np.ndarray,
    *,
    conf_threshold: float = 0.35,
    session_state: DetectorSessionState | None = None,
) -> dict[str, object]:
    detector = _get_detector()
    batch = detector.analyze(frame, conf_threshold=conf_threshold, session_state=session_state)
    annotated = detector.annotate_frame(frame, batch.detections, batch.debug_regions)
    response_detections = serialize_detections(batch.detections)
    response_debug = serialize_debug_regions(batch.debug_regions)
    response_summary = build_analysis_summary(batch.detections)

    return {
        "detections": batch.detections,
        "annotated": annotated,
        "debug_regions": batch.debug_regions,
        "response_detections": response_detections,
        "response_debug": response_debug,
        "response_summary": response_summary,
        "session_state": batch.session_state,
    }


def _persist_capture_artifacts(
    *,
    request: Request,
    user: dict[str, object] | None,
    original_bytes: bytes,
    annotated: np.ndarray,
    source: str,
    summary: dict[str, object],
    response_detections: list[dict[str, object]],
    event_id: str | None,
    event_title: str | None,
) -> CaptureRecordResponse:
    capture_storage_id = str(uuid.uuid4())
    annotated_bytes = _encode_jpeg_bytes(annotated, settings.upload_jpeg_quality)
    original_media, annotated_media = storage_service.save_capture_assets(
        capture_storage_id,
        original_bytes=original_bytes,
        annotated_bytes=annotated_bytes,
    )

    capture = create_capture(
        user_id=str(user["id"]) if user else None,
        username=str(user["username"]) if user else None,
        event_id=event_id,
        event_title=event_title,
        original_media_path=original_media.storage_path,
        annotated_media_path=annotated_media.storage_path,
        source=source,
        summary=summary,
        detections=response_detections,
    )
    return _serialize_capture_response(request, capture)


def _require_file_size(contents: bytes) -> None:
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large.")


def _current_user_from_token(token: str | None) -> dict[str, object] | None:
    if not token:
        return None

    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError:
        return None

    subject = payload.get("sub")
    if not isinstance(subject, str):
        return None
    return get_user_by_id(subject)


def _ensure_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None,
) -> dict[str, object]:
    token = credentials.credentials if credentials else None
    user = _current_user_from_token(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object]:
    return _ensure_authenticated_user(credentials)


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object] | None:
    token = credentials.credentials if credentials else None
    return _current_user_from_token(token)


def get_inference_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, object] | None:
    if settings.inference_auth_enabled:
        return _ensure_authenticated_user(credentials)
    return get_optional_user(credentials)


def get_admin_user(
    current_user: dict[str, object] = Depends(get_current_user),
) -> dict[str, object]:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user


async def _send_password_reset_email(email: str, code: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        return

    def _send() -> None:
        message = EmailMessage()
        message["Subject"] = "Your EventCapture reset code"
        message["From"] = settings.smtp_from_email
        message["To"] = email
        message.set_content(
            "Use this EventCapture password reset code within "
            f"{settings.password_reset_code_minutes} minutes: {code}"
        )

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    await asyncio.to_thread(_send)


async def _read_avatar_upload(avatar_file: UploadFile | None) -> tuple[bytes | None, str | None, str | None]:
    if avatar_file is None:
        return None, None, None
    contents = await avatar_file.read()
    _require_file_size(contents)
    return contents, avatar_file.filename, avatar_file.content_type


async def _run_image_analysis_async(
    frame: np.ndarray,
    *,
    conf_threshold: float = 0.35,
    session_state: DetectorSessionState | None = None,
) -> dict[str, object]:
    async with inference_semaphore:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            inference_executor,
            partial(
                _run_image_analysis,
                frame,
                conf_threshold=conf_threshold,
                session_state=session_state,
            ),
        )


@app.get("/")
async def index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/style.css")
async def style():
    return FileResponse(FRONTEND_DIR / "style.css", media_type="text/css")


@app.get("/app.js")
async def script():
    return FileResponse(FRONTEND_DIR / "app.js", media_type="application/javascript")


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    database_ok = await asyncio.to_thread(_status_database_ok)
    return HealthResponse(
        ok=DEFAULT_MODEL_PATH.exists() and database_ok,
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
        database_ok=database_ok,
        database_url=settings.redacted_database_url(),
        media_backend=settings.media_backend,
    )


@app.get("/api/status", response_model=StatusResponse)
async def status():
    return _build_status_response()


@app.get("/api/debug", response_model=DebugStatusResponse)
async def debug_status(_admin_user: dict[str, object] = Depends(get_admin_user)):
    return DebugStatusResponse(
        status="running",
        model_path=str(DEFAULT_MODEL_PATH),
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
        debug_dir=str(settings.debug_dir),
        last_snapshot=_get_last_debug_snapshot(),
    )


@app.post("/api/auth/login", response_model=AuthSessionResponse)
async def login(request: Request, payload: AuthLoginRequest):
    user = await asyncio.to_thread(authenticate_user, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect.")

    token = create_access_token(str(user["id"]), str(user["role"]))
    return AuthSessionResponse(
        access_token=token,
        user=_serialize_user_profile_response(request, user),
    )


@app.post("/api/auth/register", response_model=AuthSessionResponse)
async def register(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    username: str = Form(...),
    full_name: str = Form(...),
    city: str = Form(default=""),
    bio: str = Form(default=""),
    avatar_uri: str | None = Form(default=None),
    avatar_file: UploadFile | None = File(default=None),
):
    initial_avatar_uri = avatar_uri.strip() if avatar_uri else settings.bootstrap_demo_avatar_uri
    try:
        user = await asyncio.to_thread(
            create_user,
            email=email,
            password=password,
            username=username,
            full_name=full_name,
            city=city,
            bio=bio,
            avatar_uri=initial_avatar_uri,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    avatar_contents, avatar_filename, avatar_content_type = await _read_avatar_upload(avatar_file)
    if avatar_contents:
        stored_avatar = await asyncio.to_thread(
            storage_service.save_avatar,
            str(user["id"]),
            content=avatar_contents,
            filename=avatar_filename,
            content_type=avatar_content_type,
        )
        user = await asyncio.to_thread(
            update_user_profile,
            str(user["id"]),
            avatar_uri=stored_avatar.storage_path,
        )

    token = create_access_token(str(user["id"]), str(user["role"]))
    return AuthSessionResponse(
        access_token=token,
        user=_serialize_user_profile_response(request, user),
    )


@app.get("/api/auth/me", response_model=UserProfileResponse)
async def me(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    return _serialize_user_profile_response(request, current_user)


@app.post("/api/auth/change-password")
async def change_password(
    payload: AuthChangePasswordRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        await asyncio.to_thread(
            change_user_password,
            str(current_user["id"]),
            payload.current_password,
            payload.new_password,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    return {"ok": True}


@app.post("/api/auth/password-reset/request", response_model=PasswordResetChallengeResponse)
async def request_password_reset(payload: PasswordResetRequest):
    result: PasswordResetRequestResult = await asyncio.to_thread(
        create_password_reset_request,
        payload.email,
    )
    if result.code and settings.smtp_host and settings.smtp_from_email:
        await _send_password_reset_email(payload.email, result.code)

    return PasswordResetChallengeResponse(
        challenge_id=result.challenge_id,
        debug_code=result.debug_code,
        message=(
            "If that account exists, a reset challenge is ready."
            if result.debug_code
            else "If that account exists, reset instructions were sent."
        ),
    )


@app.post("/api/auth/password-reset/confirm", response_model=PasswordResetConfirmResponse)
async def confirm_password_reset_route(payload: PasswordResetConfirmRequest):
    try:
        await asyncio.to_thread(
            confirm_password_reset,
            payload.challenge_id,
            payload.code,
            payload.new_password,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    return PasswordResetConfirmResponse(message="Password reset successfully.")


@app.put("/api/users/me", response_model=UserProfileResponse)
async def update_me(
    request: Request,
    email: str | None = Form(default=None),
    username: str | None = Form(default=None),
    full_name: str | None = Form(default=None),
    city: str | None = Form(default=None),
    bio: str | None = Form(default=None),
    avatar_uri: str | None = Form(default=None),
    avatar_file: UploadFile | None = File(default=None),
    current_user: dict[str, object] = Depends(get_current_user),
):
    next_avatar_uri = avatar_uri.strip() if avatar_uri else None
    avatar_contents, avatar_filename, avatar_content_type = await _read_avatar_upload(avatar_file)
    if avatar_contents:
        stored_avatar = await asyncio.to_thread(
            storage_service.save_avatar,
            str(current_user["id"]),
            content=avatar_contents,
            filename=avatar_filename,
            content_type=avatar_content_type,
        )
        next_avatar_uri = stored_avatar.storage_path

    try:
        updated_user = await asyncio.to_thread(
            update_user_profile,
            str(current_user["id"]),
            email=email,
            username=username,
            full_name=full_name,
            city=city,
            bio=bio,
            avatar_uri=next_avatar_uri,
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    return _serialize_user_profile_response(request, updated_user)


@app.delete("/api/users/me", response_model=DeleteResponse)
async def delete_me(current_user: dict[str, object] = Depends(get_current_user)):
    deleted = await asyncio.to_thread(delete_user, str(current_user["id"]))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return DeleteResponse()


@app.post("/api/detect", response_model=DetectImageResponse)
async def detect_image(
    file: UploadFile = File(...),
    _current_user: dict[str, object] | None = Depends(get_inference_user),
):
    contents = await file.read()
    _require_file_size(contents)
    frame = _decode_image(contents)
    if frame is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image.")

    analysis = await _run_image_analysis_async(frame)
    await asyncio.to_thread(
        _save_debug_artifacts,
        frame,
        analysis["annotated"],
        analysis["debug_regions"],
        analysis["detections"],
        "upload",
    )
    annotated_b64 = base64.b64encode(
        _encode_jpeg_bytes(analysis["annotated"], settings.upload_jpeg_quality)
    ).decode("utf-8")

    return DetectImageResponse(
        detections=analysis["response_detections"],
        summary=analysis["response_summary"],
        debug=analysis["response_debug"],
        annotated_image=f"data:image/jpeg;base64,{annotated_b64}",
    )


@app.post("/api/captures/analyze", response_model=AnalyzeCaptureResponse)
async def analyze_and_store_capture(
    request: Request,
    file: UploadFile = File(...),
    event_id: str | None = Form(default=None),
    event_title: str | None = Form(default=None),
    current_user: dict[str, object] = Depends(get_current_user),
):
    contents = await file.read()
    _require_file_size(contents)
    frame = _decode_image(contents)
    if frame is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image.")

    analysis = await _run_image_analysis_async(frame)
    await asyncio.to_thread(
        _save_debug_artifacts,
        frame,
        analysis["annotated"],
        analysis["debug_regions"],
        analysis["detections"],
        "capture_upload",
    )
    annotated_b64 = base64.b64encode(
        _encode_jpeg_bytes(analysis["annotated"], settings.upload_jpeg_quality)
    ).decode("utf-8")
    capture_response = await asyncio.to_thread(
        _persist_capture_artifacts,
        request=request,
        user=current_user,
        original_bytes=contents,
        annotated=analysis["annotated"],
        source="capture_upload",
        summary=analysis["response_summary"].model_dump(),
        response_detections=[item.model_dump() for item in analysis["response_detections"]],
        event_id=event_id.strip() if event_id else None,
        event_title=event_title.strip() if event_title else None,
    )

    return AnalyzeCaptureResponse(
        detections=analysis["response_detections"],
        summary=analysis["response_summary"],
        debug=analysis["response_debug"],
        annotated_image=f"data:image/jpeg;base64,{annotated_b64}",
        capture=capture_response,
    )


@app.get("/api/captures", response_model=list[CaptureListItemResponse])
async def get_captures(
    request: Request,
    limit: int = 20,
    _admin_user: dict[str, object] = Depends(get_admin_user),
):
    captures = await asyncio.to_thread(list_captures, limit)
    return [_serialize_capture_list_item(request, capture) for capture in captures]


@app.get("/api/events", response_model=list[EventPayload])
async def get_events():
    events = await asyncio.to_thread(list_events)
    return [EventPayload(**event) for event in events]


@app.post("/api/events", response_model=EventPayload)
async def create_event(
    payload: EventPayload,
    _admin_user: dict[str, object] = Depends(get_admin_user),
):
    event = await asyncio.to_thread(upsert_event, payload.model_dump())
    return EventPayload(**event)


@app.delete("/api/events/{event_id}", response_model=DeleteResponse)
async def remove_event(
    event_id: str,
    _admin_user: dict[str, object] = Depends(get_admin_user),
):
    deleted = await asyncio.to_thread(delete_event, event_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return DeleteResponse()


@app.get("/api/posts", response_model=list[PostPayload])
async def get_posts(request: Request):
    posts = await asyncio.to_thread(list_posts)
    return [_serialize_post_payload(request, post) for post in posts]


@app.post("/api/posts", response_model=PostPayload)
async def create_post(
    request: Request,
    payload: PostPayload,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        post = await asyncio.to_thread(upsert_post, payload.model_dump(), str(current_user["id"]))
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    return _serialize_post_payload(request, post)


@app.post("/api/posts/{post_id}/likes/toggle", response_model=PostPayload)
async def toggle_like(
    request: Request,
    post_id: str,
    _payload: TogglePostLikeRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        post = await asyncio.to_thread(toggle_post_like, post_id, str(current_user["id"]))
    except KeyError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.") from error
    return _serialize_post_payload(request, post)


@app.post("/api/posts/{post_id}/comments", response_model=PostPayload)
async def create_post_comment(
    request: Request,
    post_id: str,
    payload: AddPostCommentRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    if not payload.text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment text is required.")

    try:
        post = await asyncio.to_thread(
            add_post_comment,
            post_id,
            str(current_user["id"]),
            payload.text.strip(),
            "Just now",
        )
    except KeyError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.") from error
    return _serialize_post_payload(request, post)


@app.delete("/api/posts/{post_id}", response_model=DeleteResponse)
async def remove_post(
    post_id: str,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        deleted = await asyncio.to_thread(delete_post, post_id, str(current_user["id"]))
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    return DeleteResponse()


async def _authenticate_websocket(websocket: WebSocket) -> dict[str, object] | None:
    token = websocket.query_params.get("token")
    user = await asyncio.to_thread(_current_user_from_token, token)
    if settings.inference_auth_enabled and user is None:
        await websocket.close(code=1008, reason="Authentication required.")
        return None
    return user


@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    user = await _authenticate_websocket(websocket)
    if settings.inference_auth_enabled and user is None:
        return

    await websocket.accept()
    logger.info("WebSocket client connected")

    frame_count = 0
    last_fps_time = time.time()
    fps = 0.0
    session_state = DetectorSessionState()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            while True:
                try:
                    newer = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=settings.websocket_latest_frame_timeout_s,
                    )
                    newer_msg = json.loads(newer)
                    if newer_msg.get("type") == "frame":
                        message = newer_msg
                except asyncio.TimeoutError:
                    break

            if message.get("type") == "frame":
                frame_data = message["data"]
                if "," in frame_data:
                    frame_data = frame_data.split(",", 1)[1]

                img_bytes = base64.b64decode(frame_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if frame is None:
                    continue

                conf_threshold = float(message.get("conf_threshold", 0.35))
                analysis = await _run_image_analysis_async(
                    frame,
                    conf_threshold=conf_threshold,
                    session_state=session_state,
                )
                session_state = analysis["session_state"]

                await asyncio.to_thread(
                    _save_debug_artifacts,
                    frame,
                    analysis["annotated"],
                    analysis["debug_regions"],
                    analysis["detections"],
                    "websocket",
                )

                _, buffer = cv2.imencode(
                    ".jpg",
                    analysis["annotated"],
                    [cv2.IMWRITE_JPEG_QUALITY, settings.websocket_jpeg_quality],
                )
                result_b64 = base64.b64encode(buffer).decode("utf-8")

                frame_count += 1
                now = time.time()
                if now - last_fps_time >= 1.0:
                    fps = frame_count / (now - last_fps_time)
                    frame_count = 0
                    last_fps_time = now

                response = {
                    "type": "detection",
                    "frame": f"data:image/jpeg;base64,{result_b64}",
                    "detections": [item.model_dump() for item in analysis["response_detections"]],
                    "summary": analysis["response_summary"].model_dump(),
                    "debug": analysis["response_debug"].model_dump(),
                    "fps": round(fps, 1),
                    "drinking_detected": analysis["response_summary"].has_drinking_action,
                }
                await websocket.send_text(json.dumps(response))

            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as error:
        logger.exception("WebSocket error: %s", error)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port)
