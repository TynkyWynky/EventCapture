"""
FastAPI server with auth, event/post persistence, and drink detection flows.
Serves the browser frontend and handles live video frame analysis.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from pathlib import Path

import cv2
import numpy as np
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

try:
    from .api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from .config import (
        CUSTOM_MODEL_PATH,
        DATABASE_PATH,
        DEBUG_DIR,
        DEFAULT_MODEL_PATH,
        FRONTEND_DIR,
        MEDIA_DIR,
        settings,
    )
    from .database import (
        add_event_comment,
        add_post_comment,
        authenticate_user,
        change_user_password,
        create_capture,
        create_session,
        create_user,
        deactivate_user,
        delete_event,
        delete_post,
        delete_session,
        get_event_social_map,
        get_user_by_email,
        get_user_by_id,
        get_user_by_session_token,
        init_database,
        list_captures,
        list_events,
        list_planned_events,
        list_posts,
        list_users,
        reset_user_password,
        set_event_plan_note,
        set_event_plan_status,
        toggle_event_like,
        toggle_event_save,
        toggle_post_like,
        update_user_profile,
        upsert_event,
        upsert_post,
        database_exists,
    )
    from .detector import DrinkDetector
    from .schemas import (
        AddEventCommentRequest,
        AddPostCommentRequest,
        AnalyzeCaptureResponse,
        AuthTokenResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        ChangePasswordRequest,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DetectImageResponse,
        EventPayload,
        EventPlanListResponse,
        EventPlanNoteRequest,
        EventPlanRequest,
        EventSocialMapResponse,
        EventSocialStateResponse,
        HealthResponse,
        LoginRequest,
        MessageResponse,
        PostPayload,
        RegisterRequest,
        ResetPasswordRequest,
        StatusResponse,
        UpdateProfileRequest,
        UserProfileResponse,
    )
except ImportError:
    from api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from config import CUSTOM_MODEL_PATH, DATABASE_PATH, DEBUG_DIR, DEFAULT_MODEL_PATH, FRONTEND_DIR, MEDIA_DIR, settings
    from database import (
        add_event_comment,
        add_post_comment,
        authenticate_user,
        change_user_password,
        create_capture,
        create_session,
        create_user,
        deactivate_user,
        delete_event,
        delete_post,
        delete_session,
        get_event_social_map,
        get_user_by_email,
        get_user_by_id,
        get_user_by_session_token,
        init_database,
        list_captures,
        list_events,
        list_planned_events,
        list_posts,
        list_users,
        reset_user_password,
        set_event_plan_note,
        set_event_plan_status,
        toggle_event_like,
        toggle_event_save,
        toggle_post_like,
        update_user_profile,
        upsert_event,
        upsert_post,
        database_exists,
    )
    from detector import DrinkDetector
    from schemas import (
        AddEventCommentRequest,
        AddPostCommentRequest,
        AnalyzeCaptureResponse,
        AuthTokenResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        ChangePasswordRequest,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DetectImageResponse,
        EventPayload,
        EventPlanListResponse,
        EventPlanNoteRequest,
        EventPlanRequest,
        EventSocialMapResponse,
        EventSocialStateResponse,
        HealthResponse,
        LoginRequest,
        MessageResponse,
        PostPayload,
        RegisterRequest,
        ResetPasswordRequest,
        StatusResponse,
        UpdateProfileRequest,
        UserProfileResponse,
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.title, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else list(settings.allowed_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

DEBUG_DIR.mkdir(exist_ok=True)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
init_database()

detector = DrinkDetector(
    model_path=str(DEFAULT_MODEL_PATH),
    custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
)
last_debug_snapshot = DebugSnapshotResponse()

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


def _user_response(user: dict[str, object]) -> UserProfileResponse:
    return UserProfileResponse(**user)


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required.")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    return token.strip()


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, object]:
    token = _extract_bearer_token(authorization)
    user = get_user_by_session_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Your session is invalid or expired.")
    return user


def get_admin_user(current_user: dict[str, object] = Depends(get_current_user)) -> dict[str, object]:
    if str(current_user["role"]) != "admin":
        raise HTTPException(status_code=403, detail="Admin access is required.")
    return current_user


@app.exception_handler(PermissionError)
async def permission_error_handler(_: Request, exc: PermissionError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(KeyError)
async def key_error_handler(_: Request, exc: KeyError):
    detail = exc.args[0] if exc.args else "Resource not found."
    return JSONResponse(status_code=404, content={"detail": str(detail)})


@app.exception_handler(ValueError)
async def value_error_handler(_: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


def _save_debug_artifacts(frame: np.ndarray, annotated: np.ndarray, debug_regions: dict, detections: list, source: str) -> None:
    global last_debug_snapshot

    frame_path = DEBUG_DIR / "latest_frame.jpg"
    annotated_path = DEBUG_DIR / "latest_annotated.jpg"
    cv2.imwrite(str(frame_path), frame)
    cv2.imwrite(str(annotated_path), annotated)

    last_debug_snapshot = DebugSnapshotResponse(
        source=source,
        frame_size=[int(frame.shape[1]), int(frame.shape[0])],
        detection_count=len(detections),
        person_count=len(debug_regions.get("persons", [])),
        face_count=len(debug_regions.get("faces", [])),
        head_zone_count=len(debug_regions.get("head_zones", [])),
        saved_frame=str(frame_path),
        saved_annotated=str(annotated_path),
        updated_at=time.time(),
    )


def _build_status_response() -> StatusResponse:
    return StatusResponse(
        status="running",
        model=settings.model_name,
        model_path=str(DEFAULT_MODEL_PATH),
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model=CUSTOM_MODEL_PATH.exists(),
        custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
        drink_classes=list(settings.supported_drinks),
        database_path=str(DATABASE_PATH),
        database_exists=database_exists(),
        media_dir=str(MEDIA_DIR),
    )


def _decode_image(contents: bytes) -> np.ndarray | None:
    nparr = np.frombuffer(contents, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def _encode_jpeg_bytes(image: np.ndarray, quality: int) -> bytes:
    success, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not success:
        raise RuntimeError("Failed to encode image.")
    return buffer.tobytes()


def _build_media_url(request: Request, relative_path: str) -> str:
    return str(request.url_for("media", path=relative_path.replace("\\", "/")))


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


def _run_image_analysis(frame: np.ndarray) -> dict[str, object]:
    detections = detector.detect(frame)
    annotated = detector.annotate_frame(frame, detections)
    debug_regions = detector.get_debug_regions()
    response_detections = serialize_detections(detections)
    response_debug = serialize_debug_regions(debug_regions)
    response_summary = build_analysis_summary(detections)
    return {
        "detections": detections,
        "annotated": annotated,
        "debug_regions": debug_regions,
        "response_detections": response_detections,
        "response_debug": response_debug,
        "response_summary": response_summary,
    }


def _persist_capture_artifacts(*, request: Request, frame: np.ndarray, annotated: np.ndarray, source: str, summary: dict[str, object], response_detections: list[dict[str, object]], username: str | None, event_id: str | None, event_title: str | None) -> CaptureRecordResponse:
    capture_preview_id = f"capture-{int(time.time() * 1000)}"
    capture_dir = MEDIA_DIR / "captures" / capture_preview_id
    capture_dir.mkdir(parents=True, exist_ok=True)

    original_relative_path = Path("captures") / capture_preview_id / "original.jpg"
    annotated_relative_path = Path("captures") / capture_preview_id / "annotated.jpg"
    (MEDIA_DIR / original_relative_path).write_bytes(_encode_jpeg_bytes(frame, settings.upload_jpeg_quality))
    (MEDIA_DIR / annotated_relative_path).write_bytes(_encode_jpeg_bytes(annotated, settings.upload_jpeg_quality))

    capture = create_capture(
        username=username,
        event_id=event_id,
        event_title=event_title,
        original_media_path=original_relative_path.as_posix(),
        annotated_media_path=annotated_relative_path.as_posix(),
        source=source,
        summary=summary,
        detections=response_detections,
    )
    return _serialize_capture_response(request, capture)


def _auth_response(user: dict[str, object]) -> AuthTokenResponse:
    session = create_session(str(user["id"]), settings.session_ttl_hours)
    return AuthTokenResponse(token=session["token"], expires_at=session["expires_at"], user=_user_response(user))


@app.get("/")
async def index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/style.css")
async def style():
    return FileResponse(FRONTEND_DIR / "style.css", media_type="text/css")


@app.get("/app.js")
async def script():
    return FileResponse(FRONTEND_DIR / "app.js", media_type="application/javascript")


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        ok=DEFAULT_MODEL_PATH.exists() and database_exists(),
        status="ok" if database_exists() else "degraded",
        environment=settings.environment,
        version=settings.version,
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
        database_exists=database_exists(),
        database_path=str(DATABASE_PATH),
    )


@app.get("/api/status", response_model=StatusResponse)
async def status():
    return _build_status_response()


@app.get("/api/debug", response_model=DebugStatusResponse)
async def debug_status():
    return DebugStatusResponse(
        status="running",
        model_path=str(DEFAULT_MODEL_PATH),
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
        debug_dir=str(DEBUG_DIR),
        last_snapshot=last_debug_snapshot,
    )


@app.post("/api/auth/register", response_model=AuthTokenResponse, status_code=201)
async def register(payload: RegisterRequest):
    if get_user_by_email(payload.email) is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    try:
        user = create_user(
            email=str(payload.email),
            username=payload.username,
            password=payload.password,
            full_name=payload.full_name,
            city=payload.city,
            bio=payload.bio,
            avatar_uri=payload.avatar_uri,
        )
    except Exception as exc:
        message = str(exc).lower()
        if "unique" in message:
            raise HTTPException(status_code=409, detail="That username or email is already in use.") from exc
        raise
    return _auth_response(user)


@app.post("/api/auth/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest):
    user = authenticate_user(str(payload.email), payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _auth_response(user)


@app.post("/api/auth/logout", response_model=MessageResponse)
async def logout(authorization: str | None = Header(default=None)):
    token = _extract_bearer_token(authorization)
    delete_session(token)
    return MessageResponse(message="Signed out successfully.")


@app.delete("/api/auth/account", response_model=MessageResponse)
async def delete_account(
    current_user: dict[str, object] = Depends(get_current_user),
    authorization: str | None = Header(default=None),
):
    if str(current_user["role"]) == "admin":
        raise HTTPException(status_code=403, detail="Admin accounts cannot self-delete from this route.")
    if not deactivate_user(str(current_user["id"])):
        raise HTTPException(status_code=404, detail="User not found.")
    token = _extract_bearer_token(authorization)
    delete_session(token)
    return MessageResponse(message="Account deleted successfully.")


@app.get("/api/auth/me", response_model=UserProfileResponse)
async def me(current_user: dict[str, object] = Depends(get_current_user)):
    return _user_response(current_user)


@app.put("/api/auth/profile", response_model=UserProfileResponse)
async def update_profile(payload: UpdateProfileRequest, current_user: dict[str, object] = Depends(get_current_user)):
    existing = get_user_by_email(str(payload.email))
    if existing is not None and existing["id"] != current_user["id"]:
        raise HTTPException(status_code=409, detail="That email address is already in use.")
    try:
        updated = update_user_profile(
            str(current_user["id"]),
            username=payload.username,
            full_name=payload.full_name,
            city=payload.city,
            bio=payload.bio,
            avatar_uri=payload.avatar_uri,
            email=str(payload.email),
        )
    except Exception as exc:
        if "unique" in str(exc).lower():
            raise HTTPException(status_code=409, detail="That username or email is already in use.") from exc
        raise
    return _user_response(updated)


@app.post("/api/auth/change-password", response_model=MessageResponse)
async def change_password(payload: ChangePasswordRequest, current_user: dict[str, object] = Depends(get_current_user)):
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="Choose a different new password.")
    if not change_user_password(str(current_user["id"]), payload.current_password, payload.new_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    return MessageResponse(message="Password updated successfully.")


@app.post("/api/auth/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest):
    if not settings.allow_insecure_password_reset and not settings.debug:
        raise HTTPException(status_code=501, detail="Password reset is not configured for this environment.")
    if not reset_user_password(str(payload.email), payload.new_password):
        raise HTTPException(status_code=404, detail="No account matches that email address.")
    return MessageResponse(message="Password reset successfully.")


@app.get("/api/users", response_model=list[UserProfileResponse])
async def get_users(_: dict[str, object] = Depends(get_admin_user)):
    return [_user_response(user) for user in list_users()]


@app.delete("/api/users/{user_id}", response_model=MessageResponse)
async def ban_user(user_id: str, _: dict[str, object] = Depends(get_admin_user)):
    if not deactivate_user(user_id):
        raise HTTPException(status_code=404, detail="User not found.")
    return MessageResponse(message="User removed successfully.")


@app.get("/api/events", response_model=list[EventPayload])
async def get_events():
    return [EventPayload(**event) for event in list_events()]


@app.post("/api/events", response_model=EventPayload)
async def create_or_update_event(payload: EventPayload, current_user: dict[str, object] = Depends(get_current_user)):
    return EventPayload(**upsert_event(payload.model_dump(), current_user))


@app.delete("/api/events/{event_id}", response_model=MessageResponse)
async def remove_event(event_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    deleted = delete_event(event_id, current_user)
    if not deleted:
        raise HTTPException(status_code=404, detail="Event not found.")
    return MessageResponse(message="Event deleted successfully.")


@app.get("/api/events/social", response_model=EventSocialMapResponse)
async def get_event_social(current_user: dict[str, object] = Depends(get_current_user)):
    return EventSocialMapResponse(items=get_event_social_map(str(current_user["id"])))


@app.post("/api/events/{event_id}/likes/toggle", response_model=EventSocialStateResponse)
async def toggle_like(event_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    return EventSocialStateResponse(**toggle_event_like(event_id, current_user))


@app.post("/api/events/{event_id}/save-toggle", response_model=EventSocialStateResponse)
async def toggle_save(event_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    return EventSocialStateResponse(**toggle_event_save(event_id, current_user))


@app.post("/api/events/{event_id}/plan", response_model=EventSocialStateResponse)
async def update_event_plan(event_id: str, payload: EventPlanRequest, current_user: dict[str, object] = Depends(get_current_user)):
    return EventSocialStateResponse(**set_event_plan_status(event_id, current_user, payload.status))


@app.post("/api/events/{event_id}/plan-note", response_model=EventSocialStateResponse)
async def update_event_plan_note(event_id: str, payload: EventPlanNoteRequest, current_user: dict[str, object] = Depends(get_current_user)):
    return EventSocialStateResponse(**set_event_plan_note(event_id, current_user, payload.note))


@app.post("/api/events/{event_id}/comments", response_model=EventSocialStateResponse)
async def create_event_comment(event_id: str, payload: AddEventCommentRequest, current_user: dict[str, object] = Depends(get_current_user)):
    return EventSocialStateResponse(**add_event_comment(event_id, current_user, payload.text))


@app.get("/api/events/plans", response_model=EventPlanListResponse)
async def get_event_plans(current_user: dict[str, object] = Depends(get_current_user)):
    return EventPlanListResponse(items=list_planned_events(str(current_user["id"])))


@app.get("/api/posts", response_model=list[PostPayload])
async def get_posts():
    return [PostPayload(**post) for post in list_posts()]


@app.post("/api/posts", response_model=PostPayload)
async def create_post(payload: PostPayload, current_user: dict[str, object] = Depends(get_current_user)):
    return PostPayload(**upsert_post(payload.model_dump(exclude_none=True), current_user))


@app.post("/api/posts/{post_id}/likes/toggle", response_model=PostPayload)
async def toggle_post_like_route(post_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    return PostPayload(**toggle_post_like(post_id, current_user))


@app.post("/api/posts/{post_id}/comments", response_model=PostPayload)
async def create_post_comment(post_id: str, payload: AddPostCommentRequest, current_user: dict[str, object] = Depends(get_current_user)):
    return PostPayload(**add_post_comment(post_id, current_user, payload.text, "Just now"))


@app.delete("/api/posts/{post_id}", response_model=MessageResponse)
async def remove_post(post_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    deleted = delete_post(post_id, current_user)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found.")
    return MessageResponse(message="Post deleted successfully.")


@app.post("/api/detect", response_model=DetectImageResponse)
async def detect_image(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        return JSONResponse(status_code=413, content={"error": "File too large"})

    frame = _decode_image(contents)
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})

    analysis = _run_image_analysis(frame)
    _save_debug_artifacts(frame, analysis["annotated"], analysis["debug_regions"], analysis["detections"], source="upload")
    annotated_b64 = base64.b64encode(_encode_jpeg_bytes(analysis["annotated"], settings.upload_jpeg_quality)).decode("utf-8")

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
    if len(contents) > settings.max_upload_bytes:
        return JSONResponse(status_code=413, content={"error": "File too large"})

    frame = _decode_image(contents)
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})

    analysis = _run_image_analysis(frame)
    _save_debug_artifacts(frame, analysis["annotated"], analysis["debug_regions"], analysis["detections"], source="capture_upload")
    annotated_b64 = base64.b64encode(_encode_jpeg_bytes(analysis["annotated"], settings.upload_jpeg_quality)).decode("utf-8")
    capture_response = _persist_capture_artifacts(
        request=request,
        frame=frame,
        annotated=analysis["annotated"],
        source="capture_upload",
        summary=analysis["response_summary"].model_dump(),
        response_detections=[item.model_dump() for item in analysis["response_detections"]],
        username=str(current_user["username"]),
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
async def get_captures(request: Request, limit: int = 20, _: dict[str, object] = Depends(get_current_user)):
    captures = list_captures(limit=limit)
    return [_serialize_capture_list_item(request, capture) for capture in captures]


@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket client connected")
    frame_count = 0
    last_fps_time = time.time()
    fps = 0
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

                conf_threshold = message.get("conf_threshold", 0.35)
                detections = await asyncio.to_thread(detector.detect, frame, conf_threshold=conf_threshold)
                debug_regions = detector.get_debug_regions()
                summary = build_analysis_summary(detections)
                response_detections = serialize_detections(detections)
                response_debug = serialize_debug_regions(debug_regions)

                annotated = await asyncio.to_thread(detector.annotate_frame, frame, detections)
                await asyncio.to_thread(_save_debug_artifacts, frame, annotated, debug_regions, detections, "websocket")

                _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, settings.websocket_jpeg_quality])
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
                    "detections": [item.model_dump() for item in response_detections],
                    "summary": summary.model_dump(),
                    "debug": response_debug.model_dump(),
                    "fps": round(fps, 1),
                    "drinking_detected": summary.has_drinking_action,
                }
                await websocket.send_text(json.dumps(response))

            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as exc:  # pragma: no cover
        logger.error("WebSocket error: %s", exc)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port)
