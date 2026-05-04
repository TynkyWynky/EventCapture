"""
FastAPI server with WebSocket support, persisted captures, and app data storage.
Serves the web frontend and handles live video frame analysis.
"""

import asyncio
import base64
import json
import logging
import time
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
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
        add_post_comment,
        create_capture,
        delete_post,
        init_database,
        list_captures,
        list_events,
        list_posts,
        toggle_post_like,
        upsert_event,
        upsert_post,
    )
    from .detector import DrinkDetector
    from .schemas import (
        AddPostCommentRequest,
        AnalyzeCaptureResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DetectImageResponse,
        EventPayload,
        HealthResponse,
        PostPayload,
        StatusResponse,
        TogglePostLikeRequest,
    )
except ImportError:
    from api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from config import (
        CUSTOM_MODEL_PATH,
        DATABASE_PATH,
        DEBUG_DIR,
        DEFAULT_MODEL_PATH,
        FRONTEND_DIR,
        MEDIA_DIR,
        settings,
    )
    from database import (
        add_post_comment,
        create_capture,
        delete_post,
        init_database,
        list_captures,
        list_events,
        list_posts,
        toggle_post_like,
        upsert_event,
        upsert_post,
    )
    from detector import DrinkDetector
    from schemas import (
        AddPostCommentRequest,
        AnalyzeCaptureResponse,
        CaptureListItemResponse,
        CaptureRecordResponse,
        DebugSnapshotResponse,
        DebugStatusResponse,
        DetectImageResponse,
        EventPayload,
        HealthResponse,
        PostPayload,
        StatusResponse,
        TogglePostLikeRequest,
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.title, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


def _save_debug_artifacts(
    frame: np.ndarray,
    annotated: np.ndarray,
    debug_regions: dict,
    detections: list,
    source: str,
) -> None:
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
        database_exists=DATABASE_PATH.exists(),
        media_dir=str(MEDIA_DIR),
    )


def _decode_image(contents: bytes) -> np.ndarray | None:
    nparr = np.frombuffer(contents, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def _encode_jpeg_bytes(image: np.ndarray, quality: int) -> bytes:
    success, buffer = cv2.imencode(
        ".jpg",
        image,
        [cv2.IMWRITE_JPEG_QUALITY, quality],
    )
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


def _persist_capture_artifacts(
    *,
    request: Request,
    frame: np.ndarray,
    annotated: np.ndarray,
    source: str,
    summary: dict[str, object],
    response_detections: list[dict[str, object]],
    username: str | None,
    event_id: str | None,
    event_title: str | None,
) -> CaptureRecordResponse:
    capture_preview_id = f"capture-{int(time.time() * 1000)}"
    capture_dir = MEDIA_DIR / "captures" / capture_preview_id
    capture_dir.mkdir(parents=True, exist_ok=True)

    original_relative_path = Path("captures") / capture_preview_id / "original.jpg"
    annotated_relative_path = Path("captures") / capture_preview_id / "annotated.jpg"
    (MEDIA_DIR / original_relative_path).write_bytes(
        _encode_jpeg_bytes(frame, settings.upload_jpeg_quality)
    )
    (MEDIA_DIR / annotated_relative_path).write_bytes(
        _encode_jpeg_bytes(annotated, settings.upload_jpeg_quality)
    )

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
    return HealthResponse(
        ok=DEFAULT_MODEL_PATH.exists(),
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
        database_exists=DATABASE_PATH.exists(),
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


@app.post("/api/detect", response_model=DetectImageResponse)
async def detect_image(file: UploadFile = File(...)):
    """Detect drinks in an uploaded image."""
    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        return JSONResponse(status_code=413, content={"error": "File too large"})

    frame = _decode_image(contents)
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})

    analysis = _run_image_analysis(frame)
    _save_debug_artifacts(
        frame,
        analysis["annotated"],
        analysis["debug_regions"],
        analysis["detections"],
        source="upload",
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
    username: str | None = Form(default=None),
    event_id: str | None = Form(default=None),
    event_title: str | None = Form(default=None),
):
    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        return JSONResponse(status_code=413, content={"error": "File too large"})

    frame = _decode_image(contents)
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})

    analysis = _run_image_analysis(frame)
    _save_debug_artifacts(
        frame,
        analysis["annotated"],
        analysis["debug_regions"],
        analysis["detections"],
        source="capture_upload",
    )
    annotated_b64 = base64.b64encode(
        _encode_jpeg_bytes(analysis["annotated"], settings.upload_jpeg_quality)
    ).decode("utf-8")
    capture_response = _persist_capture_artifacts(
        request=request,
        frame=frame,
        annotated=analysis["annotated"],
        source="capture_upload",
        summary=analysis["response_summary"].model_dump(),
        response_detections=[item.model_dump() for item in analysis["response_detections"]],
        username=username.strip() if username else None,
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
async def get_captures(request: Request, limit: int = 20):
    captures = list_captures(limit=limit)
    return [_serialize_capture_list_item(request, capture) for capture in captures]


@app.get("/api/events", response_model=list[EventPayload])
async def get_events():
    return [EventPayload(**event) for event in list_events()]


@app.post("/api/events", response_model=EventPayload)
async def create_event(payload: EventPayload):
    return EventPayload(**upsert_event(payload.model_dump()))


@app.get("/api/posts", response_model=list[PostPayload])
async def get_posts():
    return [PostPayload(**post) for post in list_posts()]


@app.post("/api/posts", response_model=PostPayload)
async def create_post(payload: PostPayload):
    return PostPayload(**upsert_post(payload.model_dump()))


@app.post("/api/posts/{post_id}/likes/toggle", response_model=PostPayload)
async def toggle_like(post_id: str, payload: TogglePostLikeRequest):
    try:
        post = toggle_post_like(post_id, payload.username.strip())
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Post not found.") from error

    return PostPayload(**post)


@app.post("/api/posts/{post_id}/comments", response_model=PostPayload)
async def create_post_comment(post_id: str, payload: AddPostCommentRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Comment text is required.")

    try:
        post = add_post_comment(
            post_id,
            payload.user.model_dump(),
            payload.text.strip(),
            "Just now",
        )
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Post not found.") from error

    return PostPayload(**post)


@app.delete("/api/posts/{post_id}")
async def remove_post(post_id: str):
    deleted = delete_post(post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found.")

    return {"deleted": True}


@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    """WebSocket endpoint for real-time drink detection from webcam frames."""
    await websocket.accept()
    logger.info("WebSocket client connected")

    frame_count = 0
    last_fps_time = time.time()
    fps = 0

    try:
        while True:
            # Receive base64 encoded frame from client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Drain any queued frames — only process the latest one
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

                # Remove data URL prefix if present
                if "," in frame_data:
                    frame_data = frame_data.split(",", 1)[1]

                # Decode frame
                img_bytes = base64.b64decode(frame_data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # Run detection in thread pool to avoid blocking the event loop
                conf_threshold = message.get("conf_threshold", 0.35)
                detections = await asyncio.to_thread(
                    detector.detect, frame, conf_threshold=conf_threshold
                )
                debug_regions = detector.get_debug_regions()
                summary = build_analysis_summary(detections)
                response_detections = serialize_detections(detections)
                response_debug = serialize_debug_regions(debug_regions)

                # Annotate frame in thread pool
                annotated = await asyncio.to_thread(
                    detector.annotate_frame, frame, detections
                )
                await asyncio.to_thread(
                    _save_debug_artifacts,
                    frame,
                    annotated,
                    debug_regions,
                    detections,
                    "websocket",
                )

                # Encode result
                _, buffer = cv2.imencode(
                    ".jpg",
                    annotated,
                    [cv2.IMWRITE_JPEG_QUALITY, settings.websocket_jpeg_quality],
                )
                result_b64 = base64.b64encode(buffer).decode("utf-8")

                # Calculate FPS
                frame_count += 1
                now = time.time()
                if now - last_fps_time >= 1.0:
                    fps = frame_count / (now - last_fps_time)
                    frame_count = 0
                    last_fps_time = now

                # Send results
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
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port)
