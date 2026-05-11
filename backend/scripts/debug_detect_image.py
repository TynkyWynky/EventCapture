from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2

try:
    from backend.api_utils import build_analysis_summary
    from backend.detector import DrinkDetector
except ImportError:
    from api_utils import build_analysis_summary
    from detector import DrinkDetector


def _serialize_detection(det) -> dict[str, object]:
    return {
        "label": det.label,
        "drink_type": det.drink_type,
        "confidence": round(float(det.confidence), 3),
        "bbox": list(det.bbox),
        "is_drinking": bool(det.is_drinking),
        "rotation_degrees": round(float(det.rotation_degrees), 2),
        "rotated_bbox": [list(point) for point in det.rotated_bbox] if det.rotated_bbox else [],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run EventCapture drink detection against a local image.")
    parser.add_argument("image_path", help="Path to the local image file to analyze.")
    args = parser.parse_args()

    image_path = Path(args.image_path).expanduser().resolve()
    if not image_path.exists():
        raise SystemExit(f"Image not found: {image_path}")

    frame = cv2.imread(str(image_path))
    if frame is None:
        raise SystemExit(f"Could not decode image: {image_path}")

    detector = DrinkDetector()
    batch = detector.analyze(frame)
    summary = build_analysis_summary(batch.detections)

    payload = {
        "image_path": str(image_path),
        "frame_shape": [int(value) for value in frame.shape[:2]],
        "detections": [_serialize_detection(det) for det in batch.detections],
        "summary": summary.model_dump(),
        "candidate_debug": batch.debug_trace,
        "debug_regions": {
            "persons": [list(bbox) for bbox in batch.debug_regions.persons],
            "faces": [list(bbox) for bbox in batch.debug_regions.faces],
            "head_zones": [list(bbox) for bbox in batch.debug_regions.head_zones],
        },
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
