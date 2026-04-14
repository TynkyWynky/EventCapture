"""Backend runtime configuration."""

from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BACKEND_DIR.parent / "frontend"
CUSTOM_MODEL_PATH = BACKEND_DIR / "models" / "drink_detector.pt"
DEFAULT_MODEL_PATH = BACKEND_DIR / "yolov8n.pt"
DEBUG_DIR = BACKEND_DIR / "debug"


@dataclass(frozen=True)
class BackendSettings:
    title: str = "Drink Detection AI"
    version: str = "1.1.0"
    model_name: str = "YOLOv8n"
    host: str = "0.0.0.0"
    port: int = 8000
    max_upload_bytes: int = 10 * 1024 * 1024
    upload_jpeg_quality: int = 85
    websocket_jpeg_quality: int = 75
    websocket_latest_frame_timeout_s: float = 0.001
    supported_drinks: tuple[str, ...] = (
        "Water",
        "Coffee",
        "Tea",
        "Soda",
        "Beer",
        "Wine",
        "Juice",
        "Energy Drink",
    )


settings = BackendSettings()
