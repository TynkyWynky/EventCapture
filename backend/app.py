"""
FastAPI server with authenticated app data APIs, Postgres-ready persistence,
configurable media storage, and concurrency-safe detection flows.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from functools import partial
from pathlib import Path

import cv2
import jwt
import numpy as np
from fastapi import Body, Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles

http_status = status

try:
    from .api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from .config import CUSTOM_MODEL_PATH, DEFAULT_MODEL_PATH, FRONTEND_DIR, settings
    from .database import (
        PasswordResetRequestResult,
        add_event_comment,
        add_post_comment,
        add_support_request_note,
        accept_group_invite,
        archive_group,
        authenticate_user,
        change_user_password,
        check_database_connection,
        consume_rate_limit,
        confirm_password_reset,
        create_activity_notification,
        create_capture,
        create_friend_request,
        create_group,
        create_password_reset_request,
        create_support_request,
        create_user,
        delete_event,
        decline_group_invite,
        get_support_request,
        is_access_token_revoked,
        list_friend_requests,
        list_friends,
        list_group_members,
        list_groups,
        list_notifications,
        list_users,
        list_event_plan_state,
        list_event_social_map,
        delete_post,
        delete_user,
        get_group_detail,
        get_group_leaderboard,
        get_public_user_profile,
        get_rewards_summary,
        list_support_requests,
        get_user_by_id,
        init_database,
        invite_group_members,
        mark_all_notifications_read,
        list_captures,
        list_events,
        list_posts,
        remove_group_member,
        remove_friend,
        revoke_access_token,
        respond_to_friend_request,
        search_users_for_friendship,
        set_event_plan_note,
        set_event_plan_status,
        set_notification_event_listener,
        toggle_event_like,
        toggle_event_save,
        toggle_post_like,
        update_support_request,
        update_group,
        update_group_member_role,
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
        AuthProfileUpdateRequest,
        AuthRegisterRequest,
        AuthSessionResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DeleteResponse,
        DetectImageResponse,
        EventPayload,
        EventPlanListResponse,
        EventSocialMapResponse,
        EventSocialStateResponse,
        FriendListItemResponse,
        FriendRequestCreateRequest,
        FriendRequestListResponse,
        FriendRequestResponse,
        GroupCreateRequest,
        GroupDetailResponse,
        GroupInvitationRequest,
        GroupLeaderboardResponse,
        GroupListResponse,
        GroupMemberResponse,
        GroupMemberUpdateRequest,
        GroupSummaryResponse,
        GroupUpdateRequest,
        HealthResponse,
        PublicUserProfileResponse,
        PasswordResetChallengeResponse,
        PasswordResetConfirmRequest,
        PasswordResetConfirmResponse,
        PasswordResetRequest,
        PostPayload,
        StatusResponse,
        SupportTicketDetailResponse,
        SupportTicketListResponse,
        SupportTicketNoteCreateRequest,
        SupportTicketNoteResponse,
        SupportTicketResponse,
        SupportTicketUpdateRequest,
        TogglePostLikeRequest,
        UserSearchResultResponse,
        UserProfileResponse,
    )
    from .mailer import (
        log_support_delivery_skip,
        password_reset_delivery_ready,
        send_password_reset_email,
        send_support_ticket_confirmation,
        send_support_ticket_notification,
        support_delivery_ready,
    )
    from .security import create_access_token, decode_access_token
    from .storage import LOCAL_MEDIA_MOUNT_NAME, StorageService
except ImportError:
    from api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from config import CUSTOM_MODEL_PATH, DEFAULT_MODEL_PATH, FRONTEND_DIR, settings
    from database import (
        PasswordResetRequestResult,
        add_event_comment,
        add_post_comment,
        add_support_request_note,
        accept_group_invite,
        archive_group,
        authenticate_user,
        change_user_password,
        check_database_connection,
        consume_rate_limit,
        confirm_password_reset,
        create_activity_notification,
        create_capture,
        create_friend_request,
        create_group,
        create_password_reset_request,
        create_support_request,
        create_user,
        delete_event,
        decline_group_invite,
        get_support_request,
        is_access_token_revoked,
        list_friend_requests,
        list_friends,
        list_group_members,
        list_groups,
        list_notifications,
        list_users,
        list_event_plan_state,
        list_event_social_map,
        delete_post,
        delete_user,
        get_group_detail,
        get_group_leaderboard,
        get_public_user_profile,
        get_rewards_summary,
        list_support_requests,
        get_user_by_id,
        init_database,
        invite_group_members,
        mark_all_notifications_read,
        list_captures,
        list_events,
        list_posts,
        remove_group_member,
        remove_friend,
        revoke_access_token,
        respond_to_friend_request,
        search_users_for_friendship,
        set_event_plan_note,
        set_event_plan_status,
        set_notification_event_listener,
        toggle_event_like,
        toggle_event_save,
        toggle_post_like,
        update_support_request,
        update_group,
        update_group_member_role,
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
        AuthProfileUpdateRequest,
        AuthRegisterRequest,
        AuthSessionResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DeleteResponse,
        DetectImageResponse,
        EventPayload,
        EventPlanListResponse,
        EventSocialMapResponse,
        EventSocialStateResponse,
        FriendListItemResponse,
        FriendRequestCreateRequest,
        FriendRequestListResponse,
        FriendRequestResponse,
        GroupCreateRequest,
        GroupDetailResponse,
        GroupInvitationRequest,
        GroupLeaderboardResponse,
        GroupListResponse,
        GroupMemberResponse,
        GroupMemberUpdateRequest,
        GroupSummaryResponse,
        GroupUpdateRequest,
        HealthResponse,
        PublicUserProfileResponse,
        PasswordResetChallengeResponse,
        PasswordResetConfirmRequest,
        PasswordResetConfirmResponse,
        PasswordResetRequest,
        PostPayload,
        StatusResponse,
        SupportTicketDetailResponse,
        SupportTicketListResponse,
        SupportTicketNoteCreateRequest,
        SupportTicketNoteResponse,
        SupportTicketResponse,
        SupportTicketUpdateRequest,
        TogglePostLikeRequest,
        UserSearchResultResponse,
        UserProfileResponse,
    )
    from mailer import (
        log_support_delivery_skip,
        password_reset_delivery_ready,
        send_password_reset_email,
        send_support_ticket_confirmation,
        send_support_ticket_notification,
        support_delivery_ready,
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
notification_connections: dict[str, set[WebSocket]] = {}
notification_connections_lock = threading.Lock()
main_event_loop: asyncio.AbstractEventLoop | None = None


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
    global main_event_loop
    main_event_loop = asyncio.get_running_loop()
    set_notification_event_listener(_handle_notification_event)
    await asyncio.to_thread(storage_service.ensure_ready)
    await asyncio.to_thread(init_database)
    try:
        yield
    finally:
        set_notification_event_listener(None)
        main_event_loop = None
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
    if avatar_uri.startswith(("blob:", "file:")):
        return ""
    if avatar_uri.startswith(("http://", "https://", "data:")):
        return avatar_uri
    return storage_service.build_public_url(request, avatar_uri)


def _build_media_url(request: Request, relative_path: str) -> str:
    if relative_path.startswith(("http://", "https://", "blob:", "file:", "data:")):
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


def _serialize_public_user_profile_response(request: Request, user: dict[str, object]) -> PublicUserProfileResponse:
    return PublicUserProfileResponse(
        id=str(user["id"]),
        username=str(user["username"]),
        avatar_uri=_resolve_avatar_uri(request, str(user["avatar_uri"])),
        full_name=str(user["full_name"]),
        bio=str(user["bio"]),
    )


def _resolve_public_user_payload(request: Request, payload: dict[str, object]) -> dict[str, object]:
    resolved = dict(payload)
    resolved["avatar_uri"] = _resolve_avatar_uri(request, str(payload.get("avatar_uri", "")))
    return resolved


def _resolve_user_search_payloads(request: Request, payloads: list[dict[str, object]]) -> list[UserSearchResultResponse]:
    return [
        UserSearchResultResponse(**_resolve_public_user_payload(request, payload))
        for payload in payloads
    ]


def _resolve_friend_request_payload(request: Request, payload: dict[str, object]) -> FriendRequestResponse:
    resolved = dict(payload)
    resolved["requester_user"] = _resolve_public_user_payload(request, dict(payload["requester_user"]))
    resolved["addressee_user"] = _resolve_public_user_payload(request, dict(payload["addressee_user"]))
    return FriendRequestResponse(**resolved)


def _resolve_friend_list_payloads(request: Request, payloads: list[dict[str, object]]) -> list[FriendListItemResponse]:
    resolved_items: list[FriendListItemResponse] = []
    for payload in payloads:
        resolved = dict(payload)
        resolved["friend"] = _resolve_public_user_payload(request, dict(payload["friend"]))
        resolved_items.append(FriendListItemResponse(**resolved))
    return resolved_items


def _resolve_event_social_payload(request: Request, payload: dict[str, object]) -> EventSocialStateResponse:
    resolved = dict(payload)
    resolved["likes"] = [
        _resolve_public_user_payload(request, dict(item))
        for item in payload.get("likes", [])
    ]
    resolved_comments: list[dict[str, object]] = []
    for comment in payload.get("comments", []):
        resolved_comment = dict(comment)
        resolved_comment["user"] = _resolve_public_user_payload(request, dict(comment["user"]))
        resolved_comments.append(resolved_comment)
    resolved["comments"] = resolved_comments
    return EventSocialStateResponse(**resolved)


def _resolve_notification_payload(request: Request, payload: dict[str, object]) -> dict[str, object]:
    resolved = dict(payload)
    resolved["actor_avatar_uri"] = _resolve_avatar_uri(request, str(payload.get("actor_avatar_uri", "")))
    return resolved


def _resolve_avatar_uri_for_websocket(websocket: WebSocket, avatar_uri: str) -> str:
    if not avatar_uri:
        return avatar_uri
    if avatar_uri.startswith(("blob:", "file:")):
        return ""
    if avatar_uri.startswith(("http://", "https://", "data:")):
        return avatar_uri
    if settings.normalized_media_url_base:
        return storage_service.build_public_url(None, avatar_uri)

    scheme = "https" if websocket.url.scheme == "wss" else "http"
    port = f":{websocket.url.port}" if websocket.url.port else ""
    normalized_path = avatar_uri.replace("\\", "/").lstrip("/")
    return f"{scheme}://{websocket.url.hostname}{port}/media/{normalized_path}"


def _resolve_notification_payload_for_websocket(websocket: WebSocket, payload: dict[str, object]) -> dict[str, object]:
    resolved = dict(payload)
    resolved["actor_avatar_uri"] = _resolve_avatar_uri_for_websocket(
        websocket,
        str(payload.get("actor_avatar_uri", "")),
    )
    return resolved


def _register_notification_connection(user_id: str, websocket: WebSocket) -> None:
    with notification_connections_lock:
        notification_connections.setdefault(user_id, set()).add(websocket)


def _unregister_notification_connection(user_id: str, websocket: WebSocket) -> None:
    with notification_connections_lock:
        sockets = notification_connections.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            notification_connections.pop(user_id, None)


def _get_notification_connections(user_id: str) -> list[WebSocket]:
    with notification_connections_lock:
        return list(notification_connections.get(user_id, set()))


async def _broadcast_notification_event(event: dict[str, object]) -> None:
    user_id = str(event.get("user_id", ""))
    if not user_id:
        return

    sockets = _get_notification_connections(user_id)
    if not sockets:
        return

    dead_sockets: list[WebSocket] = []
    for websocket in sockets:
        try:
            if event.get("type") == "notification.created":
                payload = {
                    "type": "notification.created",
                    "item": _resolve_notification_payload_for_websocket(websocket, dict(event.get("item", {}))),
                    "unread_count": int(event.get("unread_count", 0)),
                }
            elif event.get("type") == "notification.read_all":
                payload = {
                    "type": "notification.read_all",
                    "unread_count": int(event.get("unread_count", 0)),
                }
            else:
                continue
            await websocket.send_text(json.dumps(payload))
        except Exception:
            dead_sockets.append(websocket)

    for websocket in dead_sockets:
        _unregister_notification_connection(user_id, websocket)


def _handle_notification_event(event: dict[str, object]) -> None:
    if main_event_loop is None:
        return
    asyncio.run_coroutine_threadsafe(_broadcast_notification_event(event), main_event_loop)


def _resolve_group_member_payload(request: Request, payload: dict[str, object]) -> GroupMemberResponse:
    resolved = dict(payload)
    resolved["user"] = _resolve_public_user_payload(request, dict(payload["user"]))
    return GroupMemberResponse(**resolved)


def _resolve_group_summary_payload(request: Request, payload: dict[str, object]) -> GroupSummaryResponse:
    return GroupSummaryResponse(**dict(payload))


def _resolve_group_detail_payload(request: Request, payload: dict[str, object]) -> GroupDetailResponse:
    resolved = dict(payload)
    resolved["members"] = [
        _resolve_group_member_payload(request, dict(member)).model_dump()
        for member in payload.get("members", [])
    ]
    return GroupDetailResponse(**resolved)


def _resolve_group_list_payload(request: Request, payload: dict[str, object]) -> GroupListResponse:
    return GroupListResponse(
        items=[_resolve_group_summary_payload(request, dict(item)) for item in payload.get("items", [])],
        pending_invites=[_resolve_group_summary_payload(request, dict(item)) for item in payload.get("pending_invites", [])],
    )


def _resolve_group_leaderboard_payload(request: Request, payload: dict[str, object]) -> GroupLeaderboardResponse:
    resolved_entries = []
    for entry in payload.get("entries", []):
        resolved_entry = dict(entry)
        resolved_entry["avatar_url"] = _resolve_avatar_uri(request, str(entry.get("avatar_url", "")))
        resolved_entries.append(resolved_entry)
    return GroupLeaderboardResponse(
        group_id=str(payload["group_id"]),
        period=str(payload["period"]),
        generated_at=str(payload["generated_at"]),
        entries=resolved_entries,
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
        crown_awarded=bool(post["crown_awarded"]) if "crown_awarded" in post else None,
        crown_count=int(post["crown_count"]) if post.get("crown_count") is not None else None,
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

    token_jti = payload.get("jti")
    if isinstance(token_jti, str) and token_jti and is_access_token_revoked(token_jti):
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
        raise HTTPException(status_code=http_status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
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
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        first = forwarded_for.split(",", 1)[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


async def _enforce_rate_limit(
    *,
    request: Request,
    scope: str,
    max_attempts: int,
    window_seconds: int,
    actor_values: list[tuple[str, str]],
) -> None:
    retry_after_seconds = 0
    for actor_type, actor_value in actor_values:
        normalized_value = actor_value.strip()
        if not normalized_value:
            continue
        result = await asyncio.to_thread(
            consume_rate_limit,
            scope=scope,
            actor_type=actor_type,
            actor_value=normalized_value,
            max_attempts=max_attempts,
            window_seconds=window_seconds,
        )
        if result.allowed:
            continue
        retry_after_seconds = max(retry_after_seconds, result.retry_after_seconds)
    if retry_after_seconds > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again shortly.",
            headers={"Retry-After": str(retry_after_seconds)},
        )


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


def _build_health_response(database_ok: bool) -> HealthResponse:
    return HealthResponse(
        ok=DEFAULT_MODEL_PATH.exists() and database_ok,
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
        database_ok=database_ok,
        database_url=settings.redacted_database_url(),
        media_backend=settings.media_backend,
    )


@app.get("/health", response_model=HealthResponse)
async def legacy_health() -> HealthResponse:
    return await health()


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    database_ok = await asyncio.to_thread(_status_database_ok)
    return _build_health_response(database_ok)


@app.get("/api/status", response_model=StatusResponse)
async def api_status():
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
    await _enforce_rate_limit(
        request=request,
        scope="auth.login",
        max_attempts=settings.rate_limit_login_attempts,
        window_seconds=settings.rate_limit_login_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("email", payload.email.strip().lower()),
        ],
    )
    user = await asyncio.to_thread(authenticate_user, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=http_status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect.")

    token = create_access_token(str(user["id"]), str(user["role"]))
    return AuthSessionResponse(
        access_token=token,
        token=token,
        user=_serialize_user_profile_response(request, user),
    )


def _coerce_optional_string(value: object) -> str | None:
    if value is None:
        return None
    return str(value)


async def _parse_auth_request_payload(request: Request) -> tuple[dict[str, object], UploadFile | None]:
    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        avatar_candidate = form.get("avatar_file")
        avatar_file = (
            avatar_candidate
            if avatar_candidate is not None
            and hasattr(avatar_candidate, "read")
            and hasattr(avatar_candidate, "filename")
            else None
        )
        payload = {
            "email": _coerce_optional_string(form.get("email")),
            "password": _coerce_optional_string(form.get("password")),
            "username": _coerce_optional_string(form.get("username")),
            "full_name": _coerce_optional_string(form.get("full_name")),
            "city": _coerce_optional_string(form.get("city")),
            "bio": _coerce_optional_string(form.get("bio")),
            "avatar_uri": _coerce_optional_string(form.get("avatar_uri")),
        }
        return payload, avatar_file

    try:
        payload = await request.json()
    except ValueError:
        payload = {}

    if payload in (None, ""):
        payload = {}
    if not isinstance(payload, dict):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Request body must be a JSON object.")
    return payload, None


async def _parse_register_payload(request: Request) -> tuple[AuthRegisterRequest, UploadFile | None]:
    payload, avatar_file = await _parse_auth_request_payload(request)
    required_fields = ("email", "password", "username", "full_name")
    if any(not str(payload.get(field, "")).strip() for field in required_fields):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Missing required fields.")

    return (
        AuthRegisterRequest(
            email=str(payload["email"]),
            password=str(payload["password"]),
            username=str(payload["username"]),
            full_name=str(payload["full_name"]),
            city=str(payload.get("city") or ""),
            bio=str(payload.get("bio") or ""),
            avatar_uri=_coerce_optional_string(payload.get("avatar_uri")),
        ),
        avatar_file,
    )


@app.post("/api/auth/register", response_model=AuthSessionResponse)
async def register(
    request: Request,
):
    register_payload, avatar_file = await _parse_register_payload(request)
    await _enforce_rate_limit(
        request=request,
        scope="auth.register",
        max_attempts=settings.rate_limit_register_attempts,
        window_seconds=settings.rate_limit_register_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("email", register_payload.email.strip().lower()),
        ],
    )
    initial_avatar_uri = (
        register_payload.avatar_uri.strip()
        if register_payload.avatar_uri
        else settings.bootstrap_demo_avatar_uri
    )
    try:
        user = await asyncio.to_thread(
            create_user,
            email=register_payload.email,
            password=register_payload.password,
            username=register_payload.username,
            full_name=register_payload.full_name,
            city=register_payload.city,
            bio=register_payload.bio,
            avatar_uri=initial_avatar_uri,
        )
    except ValueError as error:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

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
        token=token,
        user=_serialize_user_profile_response(request, user),
    )


@app.get("/api/auth/me", response_model=UserProfileResponse)
async def me(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    return _serialize_user_profile_response(request, current_user)


@app.post("/api/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)):
    if credentials and credentials.credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            subject = payload.get("sub")
            token_jti = payload.get("jti")
            expires_at = payload.get("exp")
            if isinstance(token_jti, str) and token_jti and isinstance(expires_at, int):
                await asyncio.to_thread(
                    revoke_access_token,
                    token=credentials.credentials,
                    jti=token_jti,
                    user_id=subject if isinstance(subject, str) else None,
                    expires_at=datetime.fromtimestamp(expires_at, tz=UTC),
                )
        except jwt.PyJWTError:
            logger.warning("Ignoring invalid token during logout.")
    return {"ok": True}


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
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    return {"ok": True}


@app.post("/api/auth/password-reset/request", response_model=PasswordResetChallengeResponse)
async def request_password_reset(request: Request, payload: PasswordResetRequest):
    await _enforce_rate_limit(
        request=request,
        scope="auth.password_reset",
        max_attempts=settings.rate_limit_password_reset_attempts,
        window_seconds=settings.rate_limit_password_reset_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("email", payload.email.strip().lower()),
        ],
    )
    result: PasswordResetRequestResult = await asyncio.to_thread(
        create_password_reset_request,
        payload.email,
    )
    if result.code and password_reset_delivery_ready():
        await asyncio.to_thread(
            send_password_reset_email,
            recipient=payload.email,
            reset_token=result.code,
            expires_minutes=settings.password_reset_code_minutes,
        )

    return PasswordResetChallengeResponse(
        challenge_id=result.challenge_id,
        debug_code=result.debug_code,
        reset_token=(
            f"{result.challenge_id}:{result.debug_code}"
            if result.challenge_id and result.debug_code
            else None
        ),
        message=(
            "If that account exists, a reset challenge is ready."
            if result.debug_code
            else "If that account exists, reset instructions were sent."
        ),
    )


@app.post("/api/auth/reset-password/request", response_model=PasswordResetChallengeResponse)
async def request_password_reset_legacy(request: Request, payload: PasswordResetRequest):
    return await request_password_reset(request, payload)


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
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    return PasswordResetConfirmResponse(message="Password reset successfully.")


@app.post("/api/auth/reset-password/confirm", response_model=PasswordResetConfirmResponse)
async def confirm_password_reset_legacy(payload: dict[str, object] = Body(default_factory=dict)):
    legacy_token = str(payload.get("token", "")).strip()
    if legacy_token:
        challenge_id, separator, code = legacy_token.partition(":")
        if not challenge_id or not separator or not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token must look like challenge-id:code.",
            )
        request_payload = PasswordResetConfirmRequest(
            challenge_id=challenge_id,
            code=code,
            new_password=str(payload.get("new_password", "")),
        )
        return await confirm_password_reset_route(request_payload)

    request_payload = PasswordResetConfirmRequest(
        challenge_id=str(payload.get("challenge_id", "")),
        code=str(payload.get("code", "")),
        new_password=str(payload.get("new_password", "")),
    )
    return await confirm_password_reset_route(request_payload)


async def _parse_profile_update_payload(request: Request) -> tuple[AuthProfileUpdateRequest, UploadFile | None]:
    payload, avatar_file = await _parse_auth_request_payload(request)
    return (
        AuthProfileUpdateRequest(
            email=_coerce_optional_string(payload.get("email")),
            username=_coerce_optional_string(payload.get("username")),
            full_name=_coerce_optional_string(payload.get("full_name")),
            city=_coerce_optional_string(payload.get("city")),
            bio=_coerce_optional_string(payload.get("bio")),
            avatar_uri=_coerce_optional_string(payload.get("avatar_uri")),
        ),
        avatar_file,
    )


@app.put("/api/users/me", response_model=UserProfileResponse)
async def update_me(
    request: Request,
    current_user: dict[str, object] = Depends(get_current_user),
):
    update_payload, avatar_file = await _parse_profile_update_payload(request)
    next_avatar_uri = update_payload.avatar_uri.strip() if update_payload.avatar_uri else None
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
            email=update_payload.email,
            username=update_payload.username,
            full_name=update_payload.full_name,
            city=update_payload.city,
            bio=update_payload.bio,
            avatar_uri=next_avatar_uri,
        )
    except ValueError as error:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(error)) from error

    return _serialize_user_profile_response(request, updated_user)


@app.put("/api/auth/profile", response_model=UserProfileResponse)
async def update_me_legacy(
    request: Request,
    current_user: dict[str, object] = Depends(get_current_user),
):
    return await update_me(
        request=request,
        current_user=current_user,
    )


@app.delete("/api/users/me", response_model=DeleteResponse)
async def delete_me(current_user: dict[str, object] = Depends(get_current_user)):
    deleted = await asyncio.to_thread(delete_user, str(current_user["id"]))
    if not deleted:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="User not found.")
    return DeleteResponse()


@app.delete("/api/auth/account", response_model=DeleteResponse)
async def delete_me_legacy(current_user: dict[str, object] = Depends(get_current_user)):
    return await delete_me(current_user)


@app.get("/api/rewards/me")
async def get_my_rewards(current_user: dict[str, object] = Depends(get_current_user)):
    return await asyncio.to_thread(get_rewards_summary, str(current_user["id"]))


@app.post("/api/support/contact", response_model=SupportTicketResponse)
async def create_support_contact(
    request: Request,
    payload: dict[str, object] = Body(default_factory=dict),
    current_user: dict[str, object] | None = Depends(get_optional_user),
):
    subject = str(payload.get("subject", "")).strip()
    message = str(payload.get("message", "")).strip()
    contact_email = str(payload.get("email", "")).strip()

    if not subject or not message:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Support subject and message are required.")
    if current_user is None and not contact_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Guest support requests must include an email address.")
    requester_email = str(current_user["email"]) if current_user is not None else contact_email
    await _enforce_rate_limit(
        request=request,
        scope="support.contact",
        max_attempts=settings.rate_limit_support_attempts,
        window_seconds=settings.rate_limit_support_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("email", requester_email.strip().lower()),
            ("user", str(current_user["id"])) if current_user is not None else ("guest", requester_email.strip().lower()),
        ],
    )

    ticket = await asyncio.to_thread(
        create_support_request,
        user_id=str(current_user["id"]) if current_user is not None else None,
        email=requester_email,
        subject=subject,
        message=message,
    )
    notification_status = "ticket_saved_email_skipped"
    if support_delivery_ready():
        try:
            await asyncio.to_thread(
                send_support_ticket_notification,
                ticket_id=str(ticket["id"]),
                requester_email=requester_email,
                subject=subject,
                message=message,
                priority=str(ticket["priority"]),
            )
            if settings.support_confirmation_enabled:
                await asyncio.to_thread(
                    send_support_ticket_confirmation,
                    recipient=requester_email,
                    ticket_id=str(ticket["id"]),
                    subject=subject,
                )
            notification_status = "ticket_saved_notified"
        except Exception as error:
            logger.exception("Support ticket %s saved but email notification failed.", ticket["id"])
            notification_status = f"ticket_saved_notification_failed:{error.__class__.__name__}"
    else:
        log_support_delivery_skip(str(ticket["id"]), "SMTP or support notification recipients are not configured.")
    return SupportTicketResponse(**ticket, notification_status=notification_status)


@app.get("/api/support/requests", response_model=SupportTicketListResponse)
async def get_support_requests(limit: int = 100, _admin_user: dict[str, object] = Depends(get_admin_user)):
    items = await asyncio.to_thread(list_support_requests, limit)
    return SupportTicketListResponse(items=[SupportTicketResponse(**item) for item in items])


@app.get("/api/support/requests/{ticket_id}", response_model=SupportTicketDetailResponse)
async def get_support_request_detail(ticket_id: str, _admin_user: dict[str, object] = Depends(get_admin_user)):
    try:
        payload = await asyncio.to_thread(get_support_request, ticket_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found.")
    return SupportTicketDetailResponse(**payload)


@app.patch("/api/support/requests/{ticket_id}", response_model=SupportTicketResponse)
async def patch_support_request(
    ticket_id: str,
    payload: SupportTicketUpdateRequest,
    _admin_user: dict[str, object] = Depends(get_admin_user),
):
    next_status = payload.status.strip() if payload.status else None
    next_priority = payload.priority.strip() if payload.priority else None
    if next_status is not None and next_status not in {"new", "in_progress", "resolved", "closed"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported support ticket status.")
    if next_priority is not None and next_priority not in {"low", "normal", "high", "urgent"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported support ticket priority.")
    try:
        updated = await asyncio.to_thread(
            update_support_request,
            ticket_id,
            status=next_status,
            priority=next_priority,
        )
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found.")
    return SupportTicketResponse(**updated)


@app.post("/api/support/requests/{ticket_id}/notes", response_model=SupportTicketNoteResponse)
async def create_support_request_note(
    ticket_id: str,
    payload: SupportTicketNoteCreateRequest,
    admin_user: dict[str, object] = Depends(get_admin_user),
):
    try:
        note = await asyncio.to_thread(
            add_support_request_note,
            ticket_id,
            author_user_id=str(admin_user["id"]),
            note=payload.note,
            is_internal=payload.is_internal,
        )
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support ticket not found.")
    return SupportTicketNoteResponse(**note)


@app.post("/api/detect", response_model=DetectImageResponse)
async def detect_image(
    file: UploadFile = File(...),
    _current_user: dict[str, object] | None = Depends(get_inference_user),
):
    contents = await file.read()
    _require_file_size(contents)
    frame = _decode_image(contents)
    if frame is None:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid image.")

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
    current_user: dict[str, object] | None = Depends(get_inference_user),
):
    contents = await file.read()
    _require_file_size(contents)
    frame = _decode_image(contents)
    if frame is None:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid image.")

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


@app.get("/api/users/search", response_model=list[UserSearchResultResponse])
async def search_users(request: Request, q: str = "", current_user: dict[str, object] = Depends(get_current_user)):
    await _enforce_rate_limit(
        request=request,
        scope="users.search",
        max_attempts=settings.rate_limit_search_attempts,
        window_seconds=settings.rate_limit_search_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("user", str(current_user["id"])),
        ],
    )
    payload = await asyncio.to_thread(search_users_for_friendship, q, str(current_user["id"]))
    return _resolve_user_search_payloads(request, payload)


@app.get("/api/users", response_model=list[UserProfileResponse])
async def get_users(_admin_user: dict[str, object] = Depends(get_admin_user)):
    return await asyncio.to_thread(list_users)


@app.get("/api/users/{user_id}/public", response_model=PublicUserProfileResponse)
async def get_public_user_profile_route(
    request: Request,
    user_id: str,
    _current_user: dict[str, object] = Depends(get_current_user),
):
    payload = await asyncio.to_thread(get_public_user_profile, user_id)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return _serialize_public_user_profile_response(request, payload)


@app.delete("/api/users/{user_id}", response_model=DeleteResponse)
async def delete_user_route(user_id: str, _admin_user: dict[str, object] = Depends(get_admin_user)):
    deleted = await asyncio.to_thread(delete_user, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return DeleteResponse(deleted=True)


@app.get("/api/friends", response_model=list[FriendListItemResponse])
async def get_friends(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    payload = await asyncio.to_thread(list_friends, str(current_user["id"]))
    return _resolve_friend_list_payloads(request, payload)


@app.get("/api/friends/requests", response_model=FriendRequestListResponse)
async def get_friend_requests(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    payload = await asyncio.to_thread(list_friend_requests, str(current_user["id"]))
    return FriendRequestListResponse(
        incoming=[_resolve_friend_request_payload(request, item) for item in payload["incoming"]],
        outgoing=[_resolve_friend_request_payload(request, item) for item in payload["outgoing"]],
    )


@app.post("/api/friends/requests", response_model=FriendRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_friend_request_route(
    request: Request,
    payload: FriendRequestCreateRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        response_payload = await asyncio.to_thread(create_friend_request, str(current_user["id"]), payload.user_id)
        return _resolve_friend_request_payload(request, response_payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")


@app.post("/api/friends/requests/{request_id}/accept", response_model=FriendRequestResponse)
async def accept_friend_request_route(request: Request, request_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    try:
        response_payload = await asyncio.to_thread(respond_to_friend_request, str(current_user["id"]), request_id, accept=True)
        return _resolve_friend_request_payload(request, response_payload)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found.")


@app.post("/api/friends/requests/{request_id}/decline", response_model=FriendRequestResponse)
async def decline_friend_request_route(request: Request, request_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    try:
        response_payload = await asyncio.to_thread(respond_to_friend_request, str(current_user["id"]), request_id, accept=False)
        return _resolve_friend_request_payload(request, response_payload)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend request not found.")


@app.delete("/api/friends/{user_id}", response_model=DeleteResponse)
async def remove_friend_route(user_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    removed = await asyncio.to_thread(remove_friend, str(current_user["id"]), user_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friend not found.")
    return DeleteResponse()


@app.get("/api/notifications")
async def get_notifications(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    payload = await asyncio.to_thread(list_notifications, str(current_user["id"]))
    return {
        "items": [_resolve_notification_payload(request, item) for item in payload["items"]],
        "unread_count": payload["unread_count"],
    }


@app.post("/api/notifications/read-all")
async def read_all_notifications(current_user: dict[str, object] = Depends(get_current_user)):
    await asyncio.to_thread(mark_all_notifications_read, str(current_user["id"]))
    return {"ok": True}


@app.post("/api/notifications/activity")
async def create_notification_activity(
    request: Request,
    payload: dict[str, object] = Body(default_factory=dict),
    current_user: dict[str, object] = Depends(get_current_user),
):
    created = await asyncio.to_thread(
        create_activity_notification,
        str(current_user["id"]),
        title=str(payload.get("title", "")),
        message=str(payload.get("message", "")),
        icon=str(payload.get("icon", "notifications-outline")),
        color=str(payload.get("color", "#f97316")),
        related_type=payload.get("related_type"),
        related_id=payload.get("related_id"),
    )
    return _resolve_notification_payload(request, created)


@app.get("/api/groups", response_model=GroupListResponse)
async def get_groups(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    payload = await asyncio.to_thread(list_groups, str(current_user["id"]))
    return _resolve_group_list_payload(request, payload)


@app.post("/api/groups", response_model=GroupDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_group_route(
    request: Request,
    payload: GroupCreateRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        response_payload = await asyncio.to_thread(
            create_group,
            str(current_user["id"]),
            name=payload.name,
            description=payload.description,
            invited_user_ids=payload.invited_user_ids,
        )
        return _resolve_group_detail_payload(request, response_payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error


@app.get("/api/groups/{group_id}", response_model=GroupDetailResponse)
async def get_group_route(request: Request, group_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    try:
        payload = await asyncio.to_thread(get_group_detail, group_id, str(current_user["id"]))
        return _resolve_group_detail_payload(request, payload)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")


@app.patch("/api/groups/{group_id}", response_model=GroupDetailResponse)
async def update_group_route(
    request: Request,
    group_id: str,
    payload: GroupUpdateRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        response_payload = await asyncio.to_thread(
            update_group,
            group_id,
            str(current_user["id"]),
            name=payload.name,
            description=payload.description,
        )
        return _resolve_group_detail_payload(request, response_payload)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")


@app.delete("/api/groups/{group_id}", response_model=DeleteResponse)
async def delete_group_route(group_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    try:
        await asyncio.to_thread(archive_group, group_id, str(current_user["id"]))
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    return DeleteResponse()


@app.post("/api/groups/{group_id}/invitations", response_model=GroupDetailResponse)
async def invite_group_members_route(
    request: Request,
    group_id: str,
    payload: GroupInvitationRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        response_payload = await asyncio.to_thread(
            invite_group_members,
            group_id,
            str(current_user["id"]),
            payload.user_ids,
        )
        return _resolve_group_detail_payload(request, response_payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")


@app.post("/api/groups/{group_id}/invitations/accept", response_model=GroupDetailResponse)
async def accept_group_invite_route(
    request: Request,
    group_id: str,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        payload = await asyncio.to_thread(accept_group_invite, group_id, str(current_user["id"]))
        return _resolve_group_detail_payload(request, payload)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")    


@app.post("/api/groups/{group_id}/invitations/decline")
async def decline_group_invite_route(group_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    try:
        await asyncio.to_thread(decline_group_invite, group_id, str(current_user["id"]))
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    return {"ok": True}


@app.get("/api/groups/{group_id}/members", response_model=list[GroupMemberResponse])
async def get_group_members_route(
    request: Request,
    group_id: str,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        payload = await asyncio.to_thread(list_group_members, group_id, str(current_user["id"]))
        return [_resolve_group_member_payload(request, item) for item in payload]
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")


@app.delete("/api/groups/{group_id}/members/{user_id}", response_model=DeleteResponse)
async def remove_group_member_route(
    group_id: str,
    user_id: str,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        await asyncio.to_thread(remove_group_member, group_id, str(current_user["id"]), user_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group member not found.")
    return DeleteResponse()


@app.patch("/api/groups/{group_id}/members/{user_id}", response_model=GroupDetailResponse)
async def update_group_member_role_route(
    request: Request,
    group_id: str,
    user_id: str,
    payload: GroupMemberUpdateRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        response_payload = await asyncio.to_thread(
            update_group_member_role,
            group_id,
            str(current_user["id"]),
            user_id,
            payload.role,
        )
        return _resolve_group_detail_payload(request, response_payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group member not found.")


@app.get("/api/groups/{group_id}/leaderboard", response_model=GroupLeaderboardResponse)
async def get_group_leaderboard_route(
    request: Request,
    group_id: str,
    period: str = "all_time",
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        payload = await asyncio.to_thread(get_group_leaderboard, group_id, str(current_user["id"]), period=period)
        return _resolve_group_leaderboard_payload(request, payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")


@app.get("/api/events/social", response_model=EventSocialMapResponse)
async def get_event_social_map(request: Request, current_user: dict[str, object] = Depends(get_current_user)):
    payload = await asyncio.to_thread(list_event_social_map, str(current_user["id"]))
    return EventSocialMapResponse(
        items={event_id: _resolve_event_social_payload(request, state) for event_id, state in payload.items()}
    )


@app.get("/api/events/plans", response_model=EventPlanListResponse)
async def get_event_plans(current_user: dict[str, object] = Depends(get_current_user)):
    return EventPlanListResponse(
        items=await asyncio.to_thread(list_event_plan_state, str(current_user["id"]))
    )


@app.post("/api/events/{event_id}/likes/toggle", response_model=EventSocialStateResponse)
async def toggle_event_like_route(request: Request, event_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    await _enforce_rate_limit(
        request=request,
        scope="events.social.mutate",
        max_attempts=settings.rate_limit_event_social_attempts,
        window_seconds=settings.rate_limit_event_social_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("user", str(current_user["id"])),
        ],
    )
    try:
        payload = await asyncio.to_thread(toggle_event_like, str(current_user["id"]), event_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return _resolve_event_social_payload(request, payload)


@app.post("/api/events/{event_id}/save-toggle", response_model=EventSocialStateResponse)
async def toggle_event_save_route(request: Request, event_id: str, current_user: dict[str, object] = Depends(get_current_user)):
    await _enforce_rate_limit(
        request=request,
        scope="events.social.mutate",
        max_attempts=settings.rate_limit_event_social_attempts,
        window_seconds=settings.rate_limit_event_social_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("user", str(current_user["id"])),
        ],
    )
    try:
        payload = await asyncio.to_thread(toggle_event_save, str(current_user["id"]), event_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return _resolve_event_social_payload(request, payload)


@app.post("/api/events/{event_id}/plan", response_model=EventSocialStateResponse)
async def set_event_plan_route(request: Request, event_id: str, payload: dict[str, object] = Body(default_factory=dict), current_user: dict[str, object] = Depends(get_current_user)):
    await _enforce_rate_limit(
        request=request,
        scope="events.social.mutate",
        max_attempts=settings.rate_limit_event_social_attempts,
        window_seconds=settings.rate_limit_event_social_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("user", str(current_user["id"])),
        ],
    )
    try:
        response_payload = await asyncio.to_thread(
            set_event_plan_status,
            str(current_user["id"]),
            event_id,
            payload.get("status"),
        )
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return _resolve_event_social_payload(request, response_payload)


@app.post("/api/events/{event_id}/plan-note", response_model=EventSocialStateResponse)
async def set_event_plan_note_route(request: Request, event_id: str, payload: dict[str, object] = Body(default_factory=dict), current_user: dict[str, object] = Depends(get_current_user)):
    await _enforce_rate_limit(
        request=request,
        scope="events.social.mutate",
        max_attempts=settings.rate_limit_event_social_attempts,
        window_seconds=settings.rate_limit_event_social_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("user", str(current_user["id"])),
        ],
    )
    try:
        response_payload = await asyncio.to_thread(
            set_event_plan_note,
            str(current_user["id"]),
            event_id,
            str(payload.get("note", "")),
        )
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return _resolve_event_social_payload(request, response_payload)


@app.post("/api/events/{event_id}/comments", response_model=EventSocialStateResponse)
async def add_event_comment_route(request: Request, event_id: str, payload: dict[str, object] = Body(default_factory=dict), current_user: dict[str, object] = Depends(get_current_user)):
    await _enforce_rate_limit(
        request=request,
        scope="events.social.mutate",
        max_attempts=settings.rate_limit_event_social_attempts,
        window_seconds=settings.rate_limit_event_social_window_seconds,
        actor_values=[
            ("ip", _get_client_ip(request)),
            ("user", str(current_user["id"])),
        ],
    )
    comment_text = str(payload.get("text", "")).strip()
    if not comment_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment text is required.")
    try:
        response_payload = await asyncio.to_thread(
            add_event_comment,
            str(current_user["id"]),
            event_id,
            comment_text,
            "Just now",
        )
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return _resolve_event_social_payload(request, response_payload)


@app.get("/api/events", response_model=list[EventPayload])
async def get_events():
    events = await asyncio.to_thread(list_events)
    return [EventPayload(**event) for event in events]


@app.get("/api/events/social")
async def get_event_social_map(current_user: dict[str, object] = Depends(get_current_user)):
    _ = current_user
    return {"items": {}}


@app.get("/api/events/plans")
async def get_event_plans(current_user: dict[str, object] = Depends(get_current_user)):
    _ = current_user
    return {"items": []}


@app.post("/api/events", response_model=EventPayload)
async def create_event(
    payload: dict[str, object] = Body(default_factory=dict),
    _current_user: dict[str, object] = Depends(get_current_user),
):
    event_payload = dict(payload)
    if not str(event_payload.get("id", "")).strip():
        event_payload["id"] = f"event-{uuid.uuid4().hex[:12]}"
    event = await asyncio.to_thread(upsert_event, event_payload)
    return EventPayload(**event)


@app.delete("/api/events/{event_id}", response_model=DeleteResponse)
async def remove_event(
    event_id: str,
    _current_user: dict[str, object] = Depends(get_current_user),
):
    deleted = await asyncio.to_thread(delete_event, event_id)
    if not deleted:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Event not found.")
    return DeleteResponse()


@app.get("/api/posts", response_model=list[PostPayload])
async def get_posts(request: Request):
    posts = await asyncio.to_thread(list_posts)
    return [_serialize_post_payload(request, post) for post in posts]


@app.post("/api/posts", response_model=PostPayload)
async def create_post(
    request: Request,
    payload: dict[str, object] = Body(default_factory=dict),
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        rewards_before = await asyncio.to_thread(get_rewards_summary, str(current_user["id"]))
        post = await asyncio.to_thread(upsert_post, dict(payload), str(current_user["id"]))
        rewards_after = await asyncio.to_thread(get_rewards_summary, str(current_user["id"]))
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    post["crown_count"] = int(rewards_after["crown_count"])
    post["crown_awarded"] = int(rewards_after["crown_count"]) > int(rewards_before["crown_count"])
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
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Post not found.") from error
    return _serialize_post_payload(request, post)


@app.post("/api/posts/{post_id}/comments", response_model=PostPayload)
async def create_post_comment(
    request: Request,
    post_id: str,
    payload: AddPostCommentRequest,
    current_user: dict[str, object] = Depends(get_current_user),
):
    if not payload.text.strip():
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Comment text is required.")

    try:
        post = await asyncio.to_thread(
            add_post_comment,
            post_id,
            str(current_user["id"]),
            payload.text.strip(),
            "Just now",
        )
    except KeyError as error:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Post not found.") from error
    return _serialize_post_payload(request, post)


@app.delete("/api/posts/{post_id}", response_model=DeleteResponse)
async def remove_post(
    post_id: str,
    current_user: dict[str, object] = Depends(get_current_user),
):
    try:
        deleted = await asyncio.to_thread(delete_post, post_id, str(current_user["id"]))
    except PermissionError as error:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    if not deleted:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Post not found.")
    return DeleteResponse()


async def _authenticate_websocket(websocket: WebSocket) -> dict[str, object] | None:
    token = websocket.query_params.get("token")
    user = await asyncio.to_thread(_current_user_from_token, token)
    if settings.inference_auth_enabled and user is None:
        await websocket.close(code=1008, reason="Authentication required.")
        return None
    return user


async def _authenticate_required_websocket(websocket: WebSocket) -> dict[str, object] | None:
    token = websocket.query_params.get("token")
    user = await asyncio.to_thread(_current_user_from_token, token)
    if user is None:
        await websocket.close(code=1008, reason="Authentication required.")
        return None
    return user


@app.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    user = await _authenticate_required_websocket(websocket)
    if user is None:
        return

    user_id = str(user["id"])
    await websocket.accept()
    _register_notification_connection(user_id, websocket)
    logger.info("Notification WebSocket connected for user %s", user_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        logger.info("Notification WebSocket disconnected for user %s", user_id)
    except Exception as error:
        logger.exception("Notification WebSocket error: %s", error)
    finally:
        _unregister_notification_connection(user_id, websocket)


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
