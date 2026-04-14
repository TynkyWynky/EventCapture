"""
Drink Detection Engine using YOLOv8.

Supports:
- Drink object detection (bottle, cup, wine glass, etc.)
- Drink type classification
- Drinking action detection (person + drink proximity)
"""

from dataclasses import dataclass
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
    mouth_bbox: tuple | None = None


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

        face_cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
        self.face_cascade = (
            cv2.CascadeClassifier(str(face_cascade_path))
            if face_cascade_path.exists()
            else None
        )

        self.drink_history: list[Detection] = []
        self._drinking_tracks: list[dict[str, object]] = []
        self._person_bboxes: list[tuple] = []
        self._person_mouth_zones: list[tuple] = []
        self._face_bboxes: list[tuple] = []

    def detect(self, frame: np.ndarray, conf_threshold: float = 0.35) -> list[Detection]:
        detections: list[Detection] = []
        persons: list[tuple] = []
        person_conf_threshold = min(conf_threshold, 0.15)
        self._face_bboxes = []

        # Run COCO model detection
        results = self.model(frame, conf=person_conf_threshold, verbose=False)

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
                    if confidence >= person_conf_threshold:
                        persons.append(bbox)

                if cls_id in DRINK_CLASS_IDS:
                    if confidence < conf_threshold:
                        continue
                    label = DRINK_COCO_CLASSES[cls_id]
                    drink_type = self._infer_drink_type(frame, bbox, label)
                    detections.append(Detection(
                        label=label,
                        confidence=confidence,
                        bbox=bbox,
                        drink_type=drink_type,
                    ))

        if not persons:
            persons = self._detect_persons(frame, person_conf_threshold=0.08)
        if not persons:
            persons = self._detect_persons_from_faces(frame)

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
        self._person_bboxes = persons
        self._person_mouth_zones = [self._get_best_mouth_bbox(person_bbox) for person_bbox in persons]
        self._detect_drinking_action(detections, persons)
        self.drink_history = detections
        return detections

    def get_debug_regions(self) -> dict[str, list[list[int]]]:
        return {
            "persons": [list(bbox) for bbox in self._person_bboxes],
            "mouth_zones": [list(bbox) for bbox in self._person_mouth_zones],
            "faces": [list(bbox) for bbox in self._face_bboxes],
        }

    def _detect_persons(self, frame: np.ndarray, person_conf_threshold: float = 0.08) -> list[tuple]:
        """Fallback person-only pass with a larger image size for webcam/selfie frames."""
        person_bboxes: list[tuple] = []
        results = self.model(
            frame,
            conf=person_conf_threshold,
            classes=[PERSON_CLASS_ID],
            imgsz=960,
            verbose=False,
        )

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue

            for box in boxes:
                confidence = float(box.conf[0])
                if confidence < person_conf_threshold:
                    continue

                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = (int(x1), int(y1), int(x2), int(y2))
                if self._is_reasonable_person_bbox(frame, bbox):
                    person_bboxes.append(bbox)

        return self._dedupe_boxes(person_bboxes)

    def _detect_persons_from_faces(self, frame: np.ndarray) -> list[tuple]:
        """Fallback for webcam framing: detect a face and expand it to an approximate upper-body box."""
        if self.face_cascade is None or self.face_cascade.empty():
            self._face_bboxes = []
            return []

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50),
        )

        frame_h, frame_w = frame.shape[:2]
        person_bboxes: list[tuple] = []
        self._face_bboxes = []

        for fx, fy, fw, fh in faces:
            self._face_bboxes.append((int(fx), int(fy), int(fx + fw), int(fy + fh)))
            px1 = max(0, int(fx - fw * 1.0))
            py1 = max(0, int(fy - fh * 0.55))
            px2 = min(frame_w, int(fx + fw * 2.0))
            py2 = min(frame_h, int(fy + fh * 4.6))
            bbox = (px1, py1, px2, py2)

            if self._is_reasonable_person_bbox(frame, bbox, allow_upper_body=True):
                person_bboxes.append(bbox)

        return self._dedupe_boxes(person_bboxes)

    def _is_reasonable_person_bbox(
        self,
        frame: np.ndarray,
        bbox: tuple,
        allow_upper_body: bool = False,
    ) -> bool:
        x1, y1, x2, y2 = bbox
        frame_h, frame_w = frame.shape[:2]
        width = max(1, x2 - x1)
        height = max(1, y2 - y1)
        area_ratio = (width * height) / max(1, frame_w * frame_h)

        min_height_ratio = 0.18 if allow_upper_body else 0.25
        min_area_ratio = 0.035 if allow_upper_body else 0.06

        return (
            width >= frame_w * 0.12
            and height >= frame_h * min_height_ratio
            and area_ratio >= min_area_ratio
        )

    def _dedupe_boxes(self, boxes: list[tuple]) -> list[tuple]:
        deduped: list[tuple] = []

        for bbox in sorted(boxes, key=lambda box: (box[2] - box[0]) * (box[3] - box[1]), reverse=True):
            if any(self._bbox_iou(bbox, existing) >= 0.5 for existing in deduped):
                continue
            deduped.append(bbox)

        return deduped

    def _get_mouth_bbox(self, person_bbox: tuple) -> tuple:
        px1, py1, px2, py2 = person_bbox
        person_width = max(1, px2 - px1)
        person_height = max(1, py2 - py1)
        return (
            int(px1 + person_width * 0.34),
            int(py1 + person_height * 0.24),
            int(px2 - person_width * 0.34),
            int(py1 + person_height * 0.38),
        )

    def _get_face_mouth_bbox(self, face_bbox: tuple) -> tuple:
        fx1, fy1, fx2, fy2 = face_bbox
        face_width = max(1, fx2 - fx1)
        face_height = max(1, fy2 - fy1)
        return (
            int(fx1 + face_width * 0.24),
            int(fy1 + face_height * 0.62),
            int(fx2 - face_width * 0.24),
            int(fy1 + face_height * 0.92),
        )

    def _get_best_mouth_bbox(self, person_bbox: tuple) -> tuple:
        base_mouth_bbox = self._get_mouth_bbox(person_bbox)
        person_center_x = (person_bbox[0] + person_bbox[2]) / 2
        best_face = None
        best_distance = None

        for face_bbox in self._face_bboxes:
            face_center_x = (face_bbox[0] + face_bbox[2]) / 2
            distance = abs(face_center_x - person_center_x)
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_face = face_bbox

        if best_face is None:
            return base_mouth_bbox

        face_mouth_bbox = self._get_face_mouth_bbox(best_face)
        px1, py1, px2, py2 = person_bbox
        mx1, my1, mx2, my2 = face_mouth_bbox
        return (
            max(px1, mx1),
            max(py1, my1),
            min(px2, mx2),
            min(py2, my2),
        )

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
        """Detect active drinking using a tighter mouth-zone heuristic plus short streak smoothing."""
        if not detections:
            self._drinking_tracks = []
            return

        raw_candidates: list[Detection] = []
        for det in detections:
            det.is_drinking = False
            det.mouth_bbox = None
            if persons and self._is_drink_near_mouth(det, persons):
                raw_candidates.append(det)

        self._update_drinking_tracks(raw_candidates)

    def _is_drink_near_mouth(self, det: Detection, persons: list[tuple]) -> bool:
        dx1, dy1, dx2, dy2 = det.bbox
        drink_width = max(1, dx2 - dx1)
        drink_height = max(1, dy2 - dy1)
        drink_center_x = (dx1 + dx2) / 2

        best_score = 0.0
        best_mouth_bbox = None

        for person_bbox in persons:
            px1, py1, px2, py2 = person_bbox
            person_width = max(1, px2 - px1)
            person_height = max(1, py2 - py1)

            mouth_left, mouth_top, mouth_right, mouth_bottom = self._get_best_mouth_bbox(person_bbox)
            mouth_center_x = (mouth_left + mouth_right) / 2
            mouth_center_y = (mouth_top + mouth_bottom) / 2

            mouth_height = max(1, mouth_bottom - mouth_top)
            contact_y = dy1 + drink_height * 0.18
            vertical_gap = abs(contact_y - mouth_center_y) / mouth_height
            horizontal_gap = abs(drink_center_x - mouth_center_x) / person_width

            overlap_x = max(0.0, min(dx2, mouth_right) - max(dx1, mouth_left))
            overlap_ratio = overlap_x / drink_width
            overlap_y = max(0.0, min(dy2, mouth_bottom) - max(dy1, mouth_top))
            mouth_overlap_ratio = overlap_y / mouth_height
            top_near_mouth = abs(dy1 - mouth_center_y) / person_height

            in_upper_body = dy1 < py1 + person_height * 0.65 and dy2 > py1 + person_height * 0.08
            touches_mouth_band = dy1 <= mouth_bottom and dy2 >= mouth_top
            reasonable_size = (
                drink_height < person_height * 0.42
                and drink_width < person_width * 0.45
                and drink_height > person_height * 0.05
            )

            if not (in_upper_body and touches_mouth_band and reasonable_size):
                continue

            score = overlap_ratio * 1.5 + mouth_overlap_ratio * 1.2 - horizontal_gap * 1.5 - vertical_gap * 0.9
            if det.label == "bottle":
                score += 0.12
            if top_near_mouth < 0.18:
                score += 0.18
            if dy1 < mouth_bottom:
                score += 0.08

            if score > best_score:
                best_score = score
                best_mouth_bbox = (mouth_left, mouth_top, mouth_right, mouth_bottom)

        det.mouth_bbox = best_mouth_bbox

        return best_score >= 0.45

    def _update_drinking_tracks(self, raw_candidates: list[Detection]) -> None:
        updated_tracks: list[dict[str, object]] = []

        for det in raw_candidates:
            matched_track = None
            matched_iou = 0.0

            for track in self._drinking_tracks:
                if track["label"] != det.label:
                    continue

                iou = self._bbox_iou(det.bbox, track["bbox"])
                if iou > matched_iou:
                    matched_iou = iou
                    matched_track = track

            streak = 1
            if matched_track is not None and matched_iou >= 0.2:
                streak = min(int(matched_track["streak"]) + 1, 6)

            det.is_drinking = streak >= 3
            updated_tracks.append({
                "label": det.label,
                "bbox": det.bbox,
                "streak": streak,
            })

        self._drinking_tracks = updated_tracks

    def _bbox_iou(self, box_a: tuple, box_b: tuple) -> float:
        ax1, ay1, ax2, ay2 = box_a
        bx1, by1, bx2, by2 = box_b

        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)

        inter_w = max(0, inter_x2 - inter_x1)
        inter_h = max(0, inter_y2 - inter_y1)
        intersection = inter_w * inter_h
        if intersection == 0:
            return 0.0

        area_a = max(1, (ax2 - ax1) * (ay2 - ay1))
        area_b = max(1, (bx2 - bx1) * (by2 - by1))
        union = area_a + area_b - intersection
        return intersection / union if union > 0 else 0.0

    def annotate_frame(self, frame: np.ndarray, detections: list[Detection]) -> np.ndarray:
        annotated = frame.copy()

        for person_bbox, mouth_bbox in zip(self._person_bboxes, self._person_mouth_zones):
            mx1, my1, mx2, my2 = mouth_bbox
            cv2.rectangle(annotated, (mx1, my1), (mx2, my2), (255, 200, 0), 1)
            cv2.putText(
                annotated,
                "Mouth zone",
                (mx1, max(15, my1 - 4)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 200, 0),
                1,
            )

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            color = (0, 255, 0)  # Green for drink detected

            if det.is_drinking:
                color = (0, 165, 255)  # Orange for drinking action

            if det.mouth_bbox is not None:
                mx1, my1, mx2, my2 = det.mouth_bbox
                mouth_color = (255, 255, 0) if det.is_drinking else (255, 200, 0)
                cv2.rectangle(annotated, (mx1, my1), (mx2, my2), mouth_color, 1)
                cv2.putText(
                    annotated,
                    "Mouth zone",
                    (mx1, max(15, my1 - 4)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    mouth_color,
                    1,
                )

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
