"""
FastAPI server with WebSocket for real-time drink detection.
Serves the web frontend and handles live video frame analysis.
"""

import asyncio
import base64
import json
import logging
import time

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

try:
    from .api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from .config import (
        CUSTOM_MODEL_PATH,
        DEBUG_DIR,
        DEFAULT_MODEL_PATH,
        FRONTEND_DIR,
        settings,
    )
    from .detector import DrinkDetector
    from .schemas import (
        DebugSnapshotResponse,
        DebugStatusResponse,
        DetectImageResponse,
        HealthResponse,
        StatusResponse,
    )
except ImportError:
    from api_utils import build_analysis_summary, serialize_debug_regions, serialize_detections
    from config import (
        CUSTOM_MODEL_PATH,
        DEBUG_DIR,
        DEFAULT_MODEL_PATH,
        FRONTEND_DIR,
        settings,
    )
    from detector import DrinkDetector
    from schemas import (
        DebugSnapshotResponse,
        DebugStatusResponse,
        DetectImageResponse,
        HealthResponse,
        StatusResponse,
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
detector = DrinkDetector(
    model_path=str(DEFAULT_MODEL_PATH),
    custom_model_path=str(CUSTOM_MODEL_PATH) if CUSTOM_MODEL_PATH.exists() else None,
)
last_debug_snapshot = DebugSnapshotResponse()


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
        mouth_zone_count=len(debug_regions.get("mouth_zones", [])),
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
    return HealthResponse(
        ok=DEFAULT_MODEL_PATH.exists(),
        model_exists=DEFAULT_MODEL_PATH.exists(),
        custom_model_exists=CUSTOM_MODEL_PATH.exists(),
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

    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "Invalid image"})

    detections = detector.detect(frame)
    annotated = detector.annotate_frame(frame, detections)
    debug_regions = detector.get_debug_regions()
    _save_debug_artifacts(frame, annotated, debug_regions, detections, source="upload")
    response_detections = serialize_detections(detections)
    response_debug = serialize_debug_regions(debug_regions)
    response_summary = build_analysis_summary(detections)

    _, buffer = cv2.imencode(
        ".jpg",
        annotated,
        [cv2.IMWRITE_JPEG_QUALITY, settings.upload_jpeg_quality],
    )
    annotated_b64 = base64.b64encode(buffer).decode("utf-8")

    return DetectImageResponse(
        detections=response_detections,
        summary=response_summary,
        debug=response_debug,
        annotated_image=f"data:image/jpeg;base64,{annotated_b64}",
    )


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
