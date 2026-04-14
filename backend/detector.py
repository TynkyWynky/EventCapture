"""
Drink Detection Engine using YOLOv8.

Supports:
- Drink object detection (bottle, cup, wine glass, etc.)
- Drink type classification
- Drinking action detection (person + drink proximity)
"""

import math
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


@dataclass
class Detection:
    label: str
    confidence: float
    bbox: tuple  # (x1, y1, x2, y2)
    drink_type: str = ""
    is_drinking: bool = False


# COCO classes relevant to drinks
DRINK_COCO_CLASSES = {
    39: "bottle",
    40: "wine glass",
    41: "cup",
    42: "fork",  # sometimes misdetected, we'll filter
    43: "knife",
    44: "spoon",
    45: "bowl",
}

DRINK_CLASS_IDS = {39, 40, 41}  # bottle, wine glass, cup
PERSON_CLASS_ID = 0

# Drink type inference based on visual cues and COCO class
DRINK_TYPE_MAP = {
    "bottle": ["Water", "Soda", "Beer", "Juice", "Energy Drink"],
    "wine glass": ["Wine", "Cocktail", "Juice"],
    "cup": ["Coffee", "Tea", "Hot Chocolate", "Water"],
}


class DrinkDetector:
    def __init__(self, model_path: str = "yolov8n.pt", custom_model_path: str | None = None):
        self.model = YOLO(model_path)
        self.custom_model = None
        if custom_model_path and Path(custom_model_path).exists():
            self.custom_model = YOLO(custom_model_path)

        self.drink_history: list[Detection] = []
        self.drinking_cooldown = 0

    def detect(self, frame: np.ndarray, conf_threshold: float = 0.35) -> list[Detection]:
        detections: list[Detection] = []
        persons: list[tuple] = []

        # Run COCO model detection
        results = self.model(frame, conf=conf_threshold, verbose=False)

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                cls_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = (int(x1), int(y1), int(x2), int(y2))

                if cls_id == PERSON_CLASS_ID:
                    persons.append(bbox)

                if cls_id in DRINK_CLASS_IDS:
                    label = DRINK_COCO_CLASSES[cls_id]
                    drink_type = self._infer_drink_type(frame, bbox, label)
                    detections.append(Detection(
                        label=label,
                        confidence=confidence,
                        bbox=bbox,
                        drink_type=drink_type,
                    ))

        # Run custom model if available
        if self.custom_model is not None:
            custom_results = self.custom_model(frame, conf=conf_threshold, verbose=False)
            for result in custom_results:
                boxes = result.boxes
                if boxes is None:
                    continue
                for box in boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bbox = (int(x1), int(y1), int(x2), int(y2))
                    label = result.names[cls_id]
                    detections.append(Detection(
                        label=label,
                        confidence=confidence,
                        bbox=bbox,
                        drink_type=label.title(),
                    ))

        # Detect drinking action
        self._detect_drinking_action(detections, persons)
        self.drink_history = detections
        return detections

    def _infer_drink_type(self, frame: np.ndarray, bbox: tuple, base_label: str) -> str:
        x1, y1, x2, y2 = bbox
        h, w = frame.shape[:2]

        # Clamp to frame bounds
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return DRINK_TYPE_MAP.get(base_label, ["Unknown"])[0]

        # Analyze color distribution for drink type hints
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        mean_hue = np.mean(hsv[:, :, 0])
        mean_sat = np.mean(hsv[:, :, 1])
        mean_val = np.mean(hsv[:, :, 2])

        if base_label == "bottle":
            return self._classify_bottle(mean_hue, mean_sat, mean_val)
        elif base_label == "wine glass":
            return self._classify_wine_glass(mean_hue, mean_sat, mean_val)
        elif base_label == "cup":
            return self._classify_cup(mean_hue, mean_sat, mean_val)
        return "Drink"

    def _classify_bottle(self, hue: float, sat: float, val: float) -> str:
        if sat < 40 and val > 180:
            return "Water"
        if 10 < hue < 25 and sat > 80:
            return "Beer"
        if 25 < hue < 45 and sat > 60:
            return "Juice"
        if hue > 90 and sat > 50:
            return "Energy Drink"
        if sat > 50:
            return "Soda"
        return "Bottle (Unknown)"

    def _classify_wine_glass(self, hue: float, sat: float, val: float) -> str:
        if 0 < hue < 15 and sat > 60:
            return "Red Wine"
        if 20 < hue < 40 and sat > 30:
            return "White Wine"
        if sat < 30 and val > 160:
            return "Water"
        return "Wine"

    def _classify_cup(self, hue: float, sat: float, val: float) -> str:
        if val < 80:
            return "Coffee"
        if 10 < hue < 30 and sat > 40:
            return "Tea"
        if sat < 40 and val > 180:
            return "Water"
        return "Hot Beverage"

    def _detect_drinking_action(self, detections: list[Detection], persons: list[tuple]) -> None:
        """Detect if a person is actively drinking by checking drink-to-face proximity."""
        if not persons or not detections:
            return

        for det in detections:
            dx1, dy1, dx2, dy2 = det.bbox
            drink_center_x = (dx1 + dx2) / 2
            drink_center_y = (dy1 + dy2) / 2

            for person_bbox in persons:
                px1, py1, px2, py2 = person_bbox
                person_width = px2 - px1
                person_height = py2 - py1

                # Face region: top ~30% of person bbox
                face_bottom = py1 + person_height * 0.35
                face_center_x = (px1 + px2) / 2

                # Check if drink is near the face region
                is_near_face_y = dy1 < face_bottom and dy2 > py1
                dist_x = abs(drink_center_x - face_center_x)
                is_near_face_x = dist_x < person_width * 0.6

                # Drink is tilted up (bottom of drink higher than top relative to face)
                drink_height = dy2 - dy1
                is_tilted = drink_center_y < face_bottom

                if is_near_face_y and is_near_face_x and is_tilted:
                    det.is_drinking = True
                    break

    def annotate_frame(self, frame: np.ndarray, detections: list[Detection]) -> np.ndarray:
        annotated = frame.copy()

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            color = (0, 255, 0)  # Green for drink detected

            if det.is_drinking:
                color = (0, 165, 255)  # Orange for drinking action

            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Label
            label = f"{det.drink_type} ({det.confidence:.0%})"
            if det.is_drinking:
                label += " - DRINKING!"

            # Background for text
            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (x1, y1 - text_h - 10), (x1 + text_w, y1), color, -1)
            cv2.putText(annotated, label, (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

        # Status bar
        drink_count = len(detections)
        drinking = any(d.is_drinking for d in detections)
        status = f"Drinks: {drink_count}"
        if drinking:
            status += " | STATUS: Drinking detected!"
        cv2.putText(annotated, status, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        return annotated
