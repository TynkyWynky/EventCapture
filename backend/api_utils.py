"""Serialization and summary helpers for backend responses."""

try:
    from .detector import Detection
    from .schemas import AnalysisSummaryResponse, DebugRegionsResponse, DetectionResponse
except ImportError:
    from detector import Detection
    from schemas import AnalysisSummaryResponse, DebugRegionsResponse, DetectionResponse


def serialize_detections(detections: list[Detection]) -> list[DetectionResponse]:
    return [
        DetectionResponse(
            label=det.label,
            drink_type=det.drink_type,
            confidence=round(det.confidence, 3),
            bbox=list(det.bbox),
            is_drinking=det.is_drinking,
            rotation_degrees=round((((det.rotation_degrees + 90.0) % 180.0) - 90.0), 2),
            rotated_bbox=[list(point) for point in det.rotated_bbox] if det.rotated_bbox else [],
        )
        for det in detections
    ]


def serialize_debug_regions(debug_regions: dict) -> DebugRegionsResponse:
    if hasattr(debug_regions, "persons") and hasattr(debug_regions, "faces") and hasattr(debug_regions, "head_zones"):
        return DebugRegionsResponse(
            persons=[list(bbox) for bbox in debug_regions.persons],
            faces=[list(bbox) for bbox in debug_regions.faces],
            head_zones=[list(bbox) for bbox in debug_regions.head_zones],
        )

    return DebugRegionsResponse(
        persons=[list(bbox) for bbox in debug_regions.get("persons", [])],
        faces=[list(bbox) for bbox in debug_regions.get("faces", [])],
        head_zones=[list(bbox) for bbox in debug_regions.get("head_zones", [])],
    )


def build_analysis_summary(detections: list[Detection]) -> AnalysisSummaryResponse:
    has_detections = bool(detections)
    has_drinking_action = any(det.is_drinking for det in detections)
    contains_beer = False

    drink_types: list[str] = []
    seen_types: set[str] = set()
    for det in detections:
        drink_name = det.drink_type or det.label.title()
        if drink_name not in seen_types:
            seen_types.add(drink_name)
            drink_types.append(drink_name)

    top_detection = max(detections, key=lambda det: det.confidence, default=None)
    top_drink = None
    top_confidence = None
    if top_detection is not None:
        top_drink = top_detection.drink_type or top_detection.label.title()
        top_confidence = round(top_detection.confidence, 3)

    crown_eligible = has_drinking_action

    if has_drinking_action:
        status_label = "drinking_detected"
        headline = "Drinking moment detected"
        message = "The detector found a drink close enough to the head zone to count as an active drinking moment."
    elif has_detections:
        status_label = "drink_detected"
        headline = "Drink detected"
        message = "The detector found drink candidates, but not a crown-eligible moment yet."
    else:
        status_label = "no_drink_detected"
        headline = "No drink detected"
        message = "No confident drink candidate was found in this capture."

    return AnalysisSummaryResponse(
        has_detections=has_detections,
        has_drinking_action=has_drinking_action,
        contains_beer=contains_beer,
        crown_eligible=crown_eligible,
        drink_count=len(detections),
        drink_types=drink_types,
        top_drink=top_drink,
        top_confidence=top_confidence,
        status_label=status_label,
        headline=headline,
        message=message,
    )
