"""
Drink detection engine using YOLOv8.

The model weights are shared across requests, but request/session state is kept
outside the detector instance so concurrent server traffic does not bleed
between users.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


BBox = tuple[int, int, int, int]


@dataclass
class Detection:
    label: str
    confidence: float
    bbox: BBox
    drink_type: str = ""
    is_drinking: bool = False
    head_bbox: BBox | None = None
    rotation_degrees: float = 90.0
    rotated_bbox: tuple[tuple[int, int], ...] | None = None


@dataclass
class DebugRegions:
    persons: list[BBox] = field(default_factory=list)
    head_zones: list[BBox] = field(default_factory=list)
    faces: list[BBox] = field(default_factory=list)


@dataclass
class DetectorSessionState:
    drinking_tracks: list[dict[str, object]] = field(default_factory=list)
    smoothed_head_bbox: BBox | None = None


@dataclass
class DetectionBatchResult:
    detections: list[Detection]
    debug_regions: DebugRegions
    session_state: DetectorSessionState


DRINK_COCO_CLASSES = {
    39: "bottle",
    40: "wine glass",
    41: "cup",
    42: "fork",
    43: "knife",
    44: "spoon",
    45: "bowl",
}
DRINK_CLASS_IDS = {39, 40, 41}
PERSON_CLASS_ID = 0

GENERIC_DRINK_TYPE = "Drink"


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

    def create_session(self) -> DetectorSessionState:
        return DetectorSessionState()

    def analyze(
        self,
        frame: np.ndarray,
        *,
        conf_threshold: float = 0.35,
        session_state: DetectorSessionState | None = None,
    ) -> DetectionBatchResult:
        state = session_state or self.create_session()
        detections: list[Detection] = []
        persons: list[BBox] = []
        face_bboxes: list[BBox] = []
        person_conf_threshold = min(conf_threshold, 0.15)

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

                if cls_id == PERSON_CLASS_ID and confidence >= person_conf_threshold:
                    persons.append(bbox)

                if cls_id in DRINK_CLASS_IDS:
                    if confidence < conf_threshold:
                        continue
                    label = DRINK_COCO_CLASSES[cls_id]
                    rotation_degrees, rotated_bbox = self._estimate_drink_pose(frame, bbox)
                    detections.append(
                        Detection(
                            label=label,
                            confidence=confidence,
                            bbox=bbox,
                            drink_type=GENERIC_DRINK_TYPE,
                            rotation_degrees=rotation_degrees,
                            rotated_bbox=rotated_bbox,
                        )
                    )

        fallback_detections = self._detect_drinks_multi_orientation(
            frame,
            conf_threshold=max(0.14, conf_threshold - 0.18),
            imgsz=960,
        )
        detections = self._merge_drink_detections(detections, fallback_detections)

        if not persons:
            persons = self._detect_persons(frame, person_conf_threshold=0.08)
        if not persons:
            persons, face_bboxes = self._detect_persons_from_faces(frame)
        persons = self._select_primary_person(frame, persons)

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
                    detections.append(
                        Detection(
                            label=result.names[cls_id],
                            confidence=confidence,
                            bbox=bbox,
                            drink_type=GENERIC_DRINK_TYPE,
                        )
                    )

        head_zones, smoothed_head_bbox = self._get_stabilized_head_zones(
            persons,
            face_bboxes,
            state.smoothed_head_bbox,
        )
        active_head_bbox = head_zones[0] if head_zones else None
        updated_tracks = self._detect_drinking_action(
            detections,
            persons,
            active_head_bbox,
            face_bboxes,
            state.drinking_tracks,
        )

        return DetectionBatchResult(
            detections=detections,
            debug_regions=DebugRegions(
                persons=persons,
                head_zones=head_zones,
                faces=face_bboxes,
            ),
            session_state=DetectorSessionState(
                drinking_tracks=updated_tracks,
                smoothed_head_bbox=smoothed_head_bbox,
            ),
        )

    def annotate_frame(
        self,
        frame: np.ndarray,
        detections: list[Detection],
        debug_regions: DebugRegions,
    ) -> np.ndarray:
        annotated = frame.copy()

        for head_bbox in debug_regions.head_zones:
            hx1, hy1, hx2, hy2 = head_bbox
            cv2.rectangle(annotated, (hx1, hy1), (hx2, hy2), (255, 200, 0), 1)
            cv2.putText(
                annotated,
                "Head zone",
                (hx1, max(15, hy1 - 4)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 200, 0),
                1,
            )

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            color = (0, 165, 255) if det.is_drinking else (0, 255, 0)

            if det.head_bbox is not None:
                hx1, hy1, hx2, hy2 = det.head_bbox
                head_color = (255, 255, 0) if det.is_drinking else (255, 200, 0)
                cv2.rectangle(annotated, (hx1, hy1), (hx2, hy2), head_color, 1)
                cv2.putText(
                    annotated,
                    "Head zone",
                    (hx1, max(15, hy1 - 4)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    head_color,
                    1,
                )

            if det.rotated_bbox is not None and len(det.rotated_bbox) == 4:
                points = np.array(det.rotated_bbox, dtype=np.int32).reshape((-1, 1, 2))
                cv2.polylines(annotated, [points], isClosed=True, color=color, thickness=2)
            else:
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            angle_label = self._normalize_rotation_angle(det.rotation_degrees)
            angle_text = "" if angle_label is None else f" {angle_label:+.0f}deg"
            label = f"{det.drink_type} ({det.confidence:.0%}){angle_text}"
            if det.is_drinking:
                label += " - DRINKING!"

            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (x1, y1 - text_h - 10), (x1 + text_w, y1), color, -1)
            cv2.putText(
                annotated,
                label,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 0),
                2,
            )

        drink_count = len(detections)
        drinking = any(detection.is_drinking for detection in detections)
        status = f"Drinks: {drink_count}"
        if drinking:
            status += " | STATUS: Drinking detected!"
        cv2.putText(
            annotated,
            status,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
        )
        return annotated

    def _detect_persons(self, frame: np.ndarray, person_conf_threshold: float = 0.08) -> list[BBox]:
        person_bboxes: list[BBox] = []
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

    def _select_primary_person(self, frame: np.ndarray, persons: list[BBox]) -> list[BBox]:
        if not persons:
            return []

        frame_h, frame_w = frame.shape[:2]
        frame_center_x = frame_w / 2

        def person_score(person_bbox: BBox) -> float:
            px1, py1, px2, py2 = person_bbox
            width = max(1, px2 - px1)
            height = max(1, py2 - py1)
            area_ratio = (width * height) / max(1, frame_w * frame_h)
            center_x = (px1 + px2) / 2
            center_penalty = abs(center_x - frame_center_x) / max(1, frame_w)
            return area_ratio * 2.2 - center_penalty * 0.7 - max(0, py1) / max(1, frame_h) * 0.12

        return [max(persons, key=person_score)]

    def _detect_drinks(
        self,
        frame: np.ndarray,
        conf_threshold: float = 0.18,
        imgsz: int = 960,
    ) -> list[Detection]:
        drink_detections: list[Detection] = []
        results = self.model(
            frame,
            conf=conf_threshold,
            classes=sorted(DRINK_CLASS_IDS),
            imgsz=imgsz,
            verbose=False,
        )

        for result in results:
            boxes = result.boxes
            if boxes is None:
                continue
            for box in boxes:
                cls_id = int(box.cls[0])
                confidence = float(box.conf[0])
                if cls_id not in DRINK_CLASS_IDS or confidence < conf_threshold:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox = (int(x1), int(y1), int(x2), int(y2))
                if not self._is_reasonable_drink_bbox(frame, bbox):
                    continue
                label = DRINK_COCO_CLASSES[cls_id]
                rotation_degrees, rotated_bbox = self._estimate_drink_pose(frame, bbox)
                drink_detections.append(
                    Detection(
                        label=label,
                        confidence=confidence,
                        bbox=bbox,
                        drink_type=GENERIC_DRINK_TYPE,
                        rotation_degrees=rotation_degrees,
                        rotated_bbox=rotated_bbox,
                    )
                )

        return self._merge_drink_detections([], drink_detections)

    def _detect_drinks_multi_orientation(
        self,
        frame: np.ndarray,
        conf_threshold: float = 0.14,
        imgsz: int = 960,
    ) -> list[Detection]:
        detections = self._detect_drinks(frame, conf_threshold=conf_threshold, imgsz=imgsz)

        for orientation in ("rot90_cw", "rot90_ccw"):
            rotated_frame = self._rotate_frame(frame, orientation)
            rotated_detections = self._detect_drinks(
                rotated_frame,
                conf_threshold=conf_threshold,
                imgsz=imgsz,
            )
            restored_detections = [
                self._restore_detection_from_rotation(det, frame.shape[:2], orientation)
                for det in rotated_detections
            ]
            detections = self._merge_drink_detections(detections, restored_detections)

        return detections

    def _rotate_frame(self, frame: np.ndarray, orientation: str) -> np.ndarray:
        if orientation == "rot90_cw":
            return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        if orientation == "rot90_ccw":
            return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
        return frame

    def _restore_detection_from_rotation(
        self,
        detection: Detection,
        original_shape: tuple[int, int],
        orientation: str,
    ) -> Detection:
        restored_points = None
        if detection.rotated_bbox is not None:
            restored_points = tuple(
                self._map_point_from_rotation(point, original_shape, orientation)
                for point in detection.rotated_bbox
            )

        restored_bbox = self._bbox_from_points(
            restored_points if restored_points is not None else (
                self._map_point_from_rotation((detection.bbox[0], detection.bbox[1]), original_shape, orientation),
                self._map_point_from_rotation((detection.bbox[2], detection.bbox[1]), original_shape, orientation),
                self._map_point_from_rotation((detection.bbox[2], detection.bbox[3]), original_shape, orientation),
                self._map_point_from_rotation((detection.bbox[0], detection.bbox[3]), original_shape, orientation),
            ),
            original_shape,
        )

        restored_rotation = self._rotation_from_polygon(restored_points)
        if restored_rotation is None:
            restored_rotation = self._default_rotation_from_bbox(restored_bbox)

        return Detection(
            label=detection.label,
            confidence=detection.confidence,
            bbox=restored_bbox,
            drink_type=detection.drink_type,
            is_drinking=detection.is_drinking,
            head_bbox=detection.head_bbox,
            rotation_degrees=restored_rotation,
            rotated_bbox=restored_points,
        )

    def _map_point_from_rotation(
        self,
        point: tuple[int, int],
        original_shape: tuple[int, int],
        orientation: str,
    ) -> tuple[int, int]:
        x, y = point
        original_h, original_w = original_shape

        if orientation == "rot90_cw":
            return (int(y), int(original_h - 1 - x))
        if orientation == "rot90_ccw":
            return (int(original_w - 1 - y), int(x))
        return (int(x), int(y))

    def _bbox_from_points(
        self,
        points: tuple[tuple[int, int], ...],
        original_shape: tuple[int, int],
    ) -> BBox:
        original_h, original_w = original_shape
        xs = [min(max(0, point[0]), original_w - 1) for point in points]
        ys = [min(max(0, point[1]), original_h - 1) for point in points]
        return (min(xs), min(ys), max(xs), max(ys))

    def _detect_persons_from_faces(self, frame: np.ndarray) -> tuple[list[BBox], list[BBox]]:
        if self.face_cascade is None or self.face_cascade.empty():
            return [], []

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50),
        )

        frame_h, frame_w = frame.shape[:2]
        person_bboxes: list[BBox] = []
        face_bboxes: list[BBox] = []

        for fx, fy, fw, fh in faces:
            face_bboxes.append((int(fx), int(fy), int(fx + fw), int(fy + fh)))
            px1 = max(0, int(fx - fw * 1.0))
            py1 = max(0, int(fy - fh * 0.55))
            px2 = min(frame_w, int(fx + fw * 2.0))
            py2 = min(frame_h, int(fy + fh * 4.6))
            bbox = (px1, py1, px2, py2)

            if self._is_reasonable_person_bbox(frame, bbox, allow_upper_body=True):
                person_bboxes.append(bbox)

        return self._dedupe_boxes(person_bboxes), face_bboxes

    def _is_reasonable_person_bbox(
        self,
        frame: np.ndarray,
        bbox: BBox,
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

    def _is_reasonable_drink_bbox(self, frame: np.ndarray, bbox: BBox) -> bool:
        x1, y1, x2, y2 = bbox
        frame_h, frame_w = frame.shape[:2]
        width = max(1, x2 - x1)
        height = max(1, y2 - y1)
        area_ratio = (width * height) / max(1, frame_w * frame_h)
        aspect_ratio = max(width, height) / max(1, min(width, height))
        return (
            width >= frame_w * 0.02
            and height >= frame_h * 0.04
            and area_ratio >= 0.0012
            and aspect_ratio <= 8.0
        )

    def _dedupe_boxes(self, boxes: list[BBox]) -> list[BBox]:
        deduped: list[BBox] = []
        for bbox in sorted(
            boxes,
            key=lambda box: (box[2] - box[0]) * (box[3] - box[1]),
            reverse=True,
        ):
            if any(self._bbox_iou(bbox, existing) >= 0.5 for existing in deduped):
                continue
            deduped.append(bbox)
        return deduped

    def _merge_drink_detections(
        self,
        primary: list[Detection],
        secondary: list[Detection],
    ) -> list[Detection]:
        merged = list(primary)

        for candidate in secondary:
            duplicate_idx = None
            for idx, existing in enumerate(merged):
                if existing.label != candidate.label:
                    continue
                if self._bbox_iou(existing.bbox, candidate.bbox) >= 0.45:
                    duplicate_idx = idx
                    break

            if duplicate_idx is None:
                merged.append(candidate)
                continue

            if candidate.confidence > merged[duplicate_idx].confidence:
                merged[duplicate_idx] = candidate

        return merged

    def _get_head_bbox(self, person_bbox: BBox) -> BBox:
        px1, py1, px2, py2 = person_bbox
        person_width = max(1, px2 - px1)
        person_height = max(1, py2 - py1)
        return (
            int(px1 + person_width * 0.28),
            int(py1 + person_height * 0.08),
            int(px2 - person_width * 0.28),
            int(py1 + person_height * 0.69),
        )

    def _get_best_head_bbox(self, person_bbox: BBox, face_bboxes: list[BBox]) -> BBox:
        person_center_x = (person_bbox[0] + person_bbox[2]) / 2
        best_face = None
        best_distance = None

        for face_bbox in face_bboxes:
            face_center_x = (face_bbox[0] + face_bbox[2]) / 2
            distance = abs(face_center_x - person_center_x)
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_face = face_bbox

        if best_face is not None:
            return best_face
        return self._get_head_bbox(person_bbox)

    def _get_stabilized_head_zones(
        self,
        persons: list[BBox],
        face_bboxes: list[BBox],
        previous_smoothed_bbox: BBox | None,
    ) -> tuple[list[BBox], BBox | None]:
        if not persons:
            return [], None

        raw_head_zones = [self._get_best_head_bbox(person_bbox, face_bboxes) for person_bbox in persons]
        stabilized_primary = self._smooth_bbox(previous_smoothed_bbox, raw_head_zones[0])
        raw_head_zones[0] = stabilized_primary
        return raw_head_zones, stabilized_primary

    def _smooth_bbox(self, previous_bbox: BBox | None, current_bbox: BBox) -> BBox:
        if previous_bbox is None:
            return current_bbox

        px1, py1, px2, py2 = previous_bbox
        cx1, cy1, cx2, cy2 = current_bbox
        prev_width = max(1.0, px2 - px1)
        prev_height = max(1.0, py2 - py1)
        curr_width = max(1.0, cx2 - cx1)
        curr_height = max(1.0, cy2 - cy1)
        scale = max(prev_width, prev_height, curr_width, curr_height)

        prev_center = ((px1 + px2) / 2.0, (py1 + py2) / 2.0)
        curr_center = ((cx1 + cx2) / 2.0, (cy1 + cy2) / 2.0)
        center_shift = float(np.hypot(curr_center[0] - prev_center[0], curr_center[1] - prev_center[1]))
        shift_ratio = center_shift / max(1.0, scale)
        size_delta = max(
            abs(curr_width - prev_width) / prev_width,
            abs(curr_height - prev_height) / prev_height,
        )

        if shift_ratio < 0.045 and size_delta < 0.12:
            return previous_bbox

        alpha = 0.22
        if shift_ratio > 0.1 or size_delta > 0.18:
            alpha = 0.38
        if shift_ratio > 0.2:
            alpha = 0.6

        return tuple(
            int(round(prev + (curr - prev) * alpha))
            for prev, curr in zip(previous_bbox, current_bbox)
        )  # type: ignore[return-value]

    def _expand_bbox(self, bbox: BBox, x_pad: float, y_pad: float) -> BBox:
        x1, y1, x2, y2 = bbox
        width = max(1, x2 - x1)
        height = max(1, y2 - y1)
        return (
            int(x1 - width * x_pad),
            int(y1 - height * y_pad),
            int(x2 + width * x_pad),
            int(y2 + height * y_pad),
        )

    def _distance_point_to_bbox(self, point: tuple[float, float], bbox: BBox) -> float:
        px, py = point
        x1, y1, x2, y2 = bbox
        dx = max(x1 - px, 0.0, px - x2)
        dy = max(y1 - py, 0.0, py - y2)
        return float(np.hypot(dx, dy))

    def _get_drink_contact_points(self, det: Detection) -> list[tuple[float, float]]:
        if det.rotated_bbox and len(det.rotated_bbox) == 4:
            points = [tuple(map(float, point)) for point in det.rotated_bbox]
            center_x = sum(point[0] for point in points) / 4
            center_y = sum(point[1] for point in points) / 4
            midpoints = [
                (
                    (points[idx][0] + points[(idx + 1) % 4][0]) / 2,
                    (points[idx][1] + points[(idx + 1) % 4][1]) / 2,
                )
                for idx in range(4)
            ]
            return [*points, *midpoints, (center_x, center_y)]

        dx1, dy1, dx2, dy2 = det.bbox
        width = max(1, dx2 - dx1)
        height = max(1, dy2 - dy1)
        center_x = (dx1 + dx2) / 2
        return [
            (center_x, dy1),
            (dx1 + width * 0.2, dy1 + height * 0.12),
            (dx2 - width * 0.2, dy1 + height * 0.12),
            (center_x, dy1 + height * 0.18),
            (dx1 + width * 0.3, dy1 + height * 0.28),
            (dx2 - width * 0.3, dy1 + height * 0.28),
            (dx1 + width * 0.18, dy1 + height * 0.5),
            (dx2 - width * 0.18, dy1 + height * 0.5),
        ]

    def _is_sideways_drink(self, det: Detection) -> bool:
        normalized_rotation = self._normalize_rotation_angle(det.rotation_degrees)
        if normalized_rotation is not None:
            return abs(normalized_rotation) <= 32
        dx1, dy1, dx2, dy2 = det.bbox
        width = max(1, dx2 - dx1)
        height = max(1, dy2 - dy1)
        return width > height * 1.05

    def _estimate_drink_pose(
        self,
        frame: np.ndarray,
        bbox: BBox,
    ) -> tuple[float, tuple[tuple[int, int], ...] | None]:
        x1, y1, x2, y2 = bbox
        frame_h, frame_w = frame.shape[:2]
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(frame_w, x2)
        y2 = min(frame_h, y2)
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return 90.0, None

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 40, 140)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return self._default_rotation_from_bbox(bbox), None

        crop_center = ((x2 - x1) / 2, (y2 - y1) / 2)
        best_contour = None
        best_score = None

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < max(20.0, crop.shape[0] * crop.shape[1] * 0.04):
                continue
            moments = cv2.moments(contour)
            if moments["m00"] == 0:
                continue
            cx = moments["m10"] / moments["m00"]
            cy = moments["m01"] / moments["m00"]
            distance_penalty = np.hypot(cx - crop_center[0], cy - crop_center[1])
            score = area - distance_penalty * 3.0
            if best_score is None or score > best_score:
                best_score = score
                best_contour = contour

        if best_contour is None:
            return self._default_rotation_from_bbox(bbox), None

        rect = cv2.minAreaRect(best_contour)
        ((_, _), (rect_w, rect_h), raw_angle) = rect
        if rect_w <= 1 or rect_h <= 1:
            return self._default_rotation_from_bbox(bbox), None

        box_points = cv2.boxPoints(rect)
        rotated_bbox = tuple(
            (int(round(point[0] + x1)), int(round(point[1] + y1)))
            for point in box_points
        )
        contour_angle = self._estimate_contour_angle(best_contour)
        if contour_angle is None:
            contour_angle = self._rotation_from_polygon(rotated_bbox)
        if contour_angle is None:
            contour_angle = raw_angle + 90 if rect_w < rect_h else raw_angle
        return float(contour_angle), rotated_bbox

    def _default_rotation_from_bbox(self, bbox: BBox) -> float:
        x1, y1, x2, y2 = bbox
        width = max(1, x2 - x1)
        height = max(1, y2 - y1)
        return 0.0 if width > height else 90.0

    def _estimate_contour_angle(self, contour: np.ndarray) -> float | None:
        if contour is None or len(contour) < 5:
            return None
        try:
            line = cv2.fitLine(contour, cv2.DIST_L2, 0, 0.01, 0.01)
        except cv2.error:
            return None

        flattened = np.asarray(line).reshape(-1)
        if flattened.size < 2:
            return None

        try:
            vx, vy = float(flattened[0]), float(flattened[1])
        except (TypeError, ValueError):
            return None

        return float(np.degrees(np.arctan2(vy, vx)))

    def _rotation_from_polygon(
        self,
        polygon: tuple[tuple[int, int], ...] | None,
    ) -> float | None:
        if polygon is None or len(polygon) < 2:
            return None

        best_angle = None
        best_length = 0.0
        for idx, start in enumerate(polygon):
            end = polygon[(idx + 1) % len(polygon)]
            dx = float(end[0] - start[0])
            dy = float(end[1] - start[1])
            length = float(np.hypot(dx, dy))
            if length > best_length:
                best_length = length
                best_angle = np.degrees(np.arctan2(dy, dx))

        return float(best_angle) if best_angle is not None else None

    def _normalize_rotation_angle(self, angle: float | None) -> float | None:
        if angle is None:
            return None
        return ((angle + 90.0) % 180.0) - 90.0

    def _detect_drinking_action(
        self,
        detections: list[Detection],
        persons: list[BBox],
        active_head_bbox: BBox | None,
        face_bboxes: list[BBox],
        previous_tracks: list[dict[str, object]],
    ) -> list[dict[str, object]]:
        if not detections:
            return []

        raw_candidates: list[Detection] = []
        for det in detections:
            det.is_drinking = False
            det.head_bbox = active_head_bbox
            if persons and self._is_drink_near_head(det, persons, active_head_bbox, face_bboxes):
                raw_candidates.append(det)

        return self._update_drinking_tracks(raw_candidates, previous_tracks)

    def _is_drink_near_head(
        self,
        det: Detection,
        persons: list[BBox],
        active_head_bbox: BBox | None,
        face_bboxes: list[BBox],
    ) -> bool:
        dx1, dy1, dx2, dy2 = det.bbox
        drink_width = max(1, dx2 - dx1)
        drink_height = max(1, dy2 - dy1)
        drink_center_x = (dx1 + dx2) / 2

        best_score = 0.0
        best_head_bbox = None

        for person_bbox in persons[:1]:
            px1, py1, px2, py2 = person_bbox
            person_width = max(1, px2 - px1)
            person_height = max(1, py2 - py1)
            head_bbox = active_head_bbox or self._get_best_head_bbox(person_bbox, face_bboxes)
            expanded_head_bbox = self._expand_bbox(
                head_bbox,
                x_pad=0.45 if self._is_sideways_drink(det) else 0.3,
                y_pad=0.34 if self._is_sideways_drink(det) else 0.24,
            )
            head_left, head_top, head_right, head_bottom = head_bbox
            head_width = max(1, head_right - head_left)
            head_height = max(1, head_bottom - head_top)
            head_center_x = (head_left + head_right) / 2
            head_center_y = (head_top + head_bottom) / 2
            contact_points = self._get_drink_contact_points(det)
            head_distance = min(
                self._distance_point_to_bbox(point, expanded_head_bbox)
                for point in contact_points
            )
            head_distance_score = 1.0 - min(
                head_distance / max(head_width, head_height, drink_width),
                1.4,
            )
            contact_y = dy1 + drink_height * 0.24
            vertical_gap = abs(contact_y - head_center_y) / head_height
            horizontal_gap = abs(drink_center_x - head_center_x) / person_width

            overlap_x = max(0.0, min(dx2, head_right) - max(dx1, head_left))
            head_overlap_ratio = overlap_x / max(1, min(drink_width, head_width))
            overlap_y = max(0.0, min(dy2, head_bottom) - max(dy1, head_top))
            vertical_overlap_ratio = overlap_y / head_height
            top_near_head = abs(dy1 - head_center_y) / person_height

            in_upper_body = dy1 < py1 + person_height * 0.62 and dy2 > py1 - person_height * 0.02
            touches_head_band = dy1 <= expanded_head_bbox[3] and dy2 >= expanded_head_bbox[1]
            reasonable_size = (
                drink_height < person_height * 0.55
                and drink_width < person_width * 0.52
                and drink_height > person_height * 0.04
            )
            near_head = head_distance_score >= (0.18 if self._is_sideways_drink(det) else 0.28)
            sideways_near_head = self._is_sideways_drink(det) and head_distance_score >= 0.14

            if not (
                in_upper_body
                and reasonable_size
                and (touches_head_band or near_head or sideways_near_head)
            ):
                continue

            score = (
                head_overlap_ratio * 1.15
                + vertical_overlap_ratio * 0.6
                + head_distance_score * 1.55
                - horizontal_gap * 0.82
                - vertical_gap * 0.45
            )
            if det.label == "bottle":
                score += 0.15
            if det.label == "wine glass":
                score += 0.12
            if top_near_head < 0.16:
                score += 0.14
            if near_head:
                score += 0.15
            if sideways_near_head:
                score += 0.36
            if touches_head_band:
                score += 0.12
            if head_overlap_ratio >= 0.18:
                score += 0.1
            if vertical_overlap_ratio >= 0.1:
                score += 0.08

            if score > best_score:
                best_score = score
                best_head_bbox = head_bbox

        det.head_bbox = best_head_bbox
        return best_score >= 0.28

    def _update_drinking_tracks(
        self,
        raw_candidates: list[Detection],
        previous_tracks: list[dict[str, object]],
    ) -> list[dict[str, object]]:
        updated_tracks: list[dict[str, object]] = []

        for det in raw_candidates:
            matched_track = None
            matched_score = 0.0
            for track in previous_tracks:
                if track["label"] != det.label:
                    continue
                iou = self._bbox_iou(det.bbox, track["bbox"])  # type: ignore[arg-type]
                center_distance = self._bbox_center_distance_ratio(det.bbox, track["bbox"])  # type: ignore[arg-type]
                if iou < 0.06 and center_distance > 0.82:
                    continue
                match_score = iou + max(0.0, 0.82 - center_distance)
                if match_score > matched_score:
                    matched_score = match_score
                    matched_track = track

            streak = 1
            if matched_track is not None:
                streak = min(int(matched_track["streak"]) + 1, 6)

            det.is_drinking = streak >= 2
            updated_tracks.append({
                "label": det.label,
                "bbox": det.bbox,
                "streak": streak,
            })

        return updated_tracks

    def _bbox_center_distance_ratio(self, box_a: BBox, box_b: BBox) -> float:
        ax1, ay1, ax2, ay2 = box_a
        bx1, by1, bx2, by2 = box_b
        center_a = ((ax1 + ax2) / 2, (ay1 + ay2) / 2)
        center_b = ((bx1 + bx2) / 2, (by1 + by2) / 2)
        distance = float(np.hypot(center_a[0] - center_b[0], center_a[1] - center_b[1]))
        scale = max(
            1.0,
            max(ax2 - ax1, ay2 - ay1),
            max(bx2 - bx1, by2 - by1),
        )
        return distance / scale

    def _bbox_iou(self, box_a: BBox, box_b: BBox) -> float:
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
