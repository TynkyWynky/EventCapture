"""API response models for the detection backend."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool
    model_exists: bool
    custom_model_exists: bool


class DetectionResponse(BaseModel):
    label: str
    drink_type: str
    confidence: float
    bbox: list[int]
    is_drinking: bool


class DebugRegionsResponse(BaseModel):
    persons: list[list[int]] = Field(default_factory=list)
    faces: list[list[int]] = Field(default_factory=list)
    mouth_zones: list[list[int]] = Field(default_factory=list)


class AnalysisSummaryResponse(BaseModel):
    has_detections: bool
    has_drinking_action: bool
    contains_beer: bool
    crown_eligible: bool
    drink_count: int
    drink_types: list[str] = Field(default_factory=list)
    top_drink: str | None = None
    top_confidence: float | None = None
    status_label: str
    headline: str
    message: str


class StatusResponse(BaseModel):
    status: str
    model: str
    model_path: str
    model_exists: bool
    custom_model: bool
    custom_model_path: str | None = None
    drink_classes: list[str]


class DebugSnapshotResponse(BaseModel):
    source: str | None = None
    frame_size: list[int] | None = None
    detection_count: int = 0
    person_count: int = 0
    face_count: int = 0
    mouth_zone_count: int = 0
    saved_frame: str | None = None
    saved_annotated: str | None = None
    updated_at: float | None = None


class DebugStatusResponse(BaseModel):
    status: str
    model_path: str
    model_exists: bool
    custom_model_path: str | None = None
    custom_model_exists: bool
    debug_dir: str
    last_snapshot: DebugSnapshotResponse


class DetectImageResponse(BaseModel):
    detections: list[DetectionResponse]
    summary: AnalysisSummaryResponse
    debug: DebugRegionsResponse
    annotated_image: str
