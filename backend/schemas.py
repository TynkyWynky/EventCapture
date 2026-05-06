"""API request and response models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool
    model_exists: bool
    custom_model_exists: bool
    database_ok: bool
    database_url: str
    media_backend: str


class DetectionResponse(BaseModel):
    label: str
    drink_type: str
    confidence: float
    bbox: list[int]
    is_drinking: bool
    rotation_degrees: float | None = None
    rotated_bbox: list[list[int]] = Field(default_factory=list)


class DebugRegionsResponse(BaseModel):
    persons: list[list[int]] = Field(default_factory=list)
    faces: list[list[int]] = Field(default_factory=list)
    head_zones: list[list[int]] = Field(default_factory=list)


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
    database_url: str
    media_backend: str
    media_root: str
    environment: str


class DebugSnapshotResponse(BaseModel):
    source: str | None = None
    frame_size: list[int] | None = None
    detection_count: int = 0
    person_count: int = 0
    face_count: int = 0
    head_zone_count: int = 0
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


class AppUserResponse(BaseModel):
    id: str
    username: str
    avatar_uri: str


class UserProfileResponse(AppUserResponse):
    full_name: str
    bio: str
    city: str
    email: str
    role: str


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetChallengeResponse(BaseModel):
    ok: bool = True
    challenge_id: str | None = None
    debug_code: str | None = None
    message: str


class PasswordResetConfirmRequest(BaseModel):
    challenge_id: str
    code: str
    new_password: str


class PasswordResetConfirmResponse(BaseModel):
    ok: bool = True
    message: str


class EventPayload(BaseModel):
    id: str
    title: str
    short_title: str | None = None
    date: str
    full_date: str
    time: str
    place: str
    address: str
    attendees: str
    attendee_count: int
    price: str
    price_label: str
    vibe: str
    experience: str
    hero_image: str
    host_name: str
    host_avatar: str
    badge: str
    description: str
    tags: list[str] = Field(default_factory=list)


class PostCommentResponse(BaseModel):
    id: str
    user: AppUserResponse
    text: str
    time: str


class PostPayload(BaseModel):
    id: str
    user: AppUserResponse
    image_uri: str
    date: str
    is_beer_finished: bool
    event_id: str | None = None
    event_title: str | None = None
    likes: list[str] = Field(default_factory=list)
    comments: list[PostCommentResponse] = Field(default_factory=list)
    capture_id: str | None = None


class AddPostCommentRequest(BaseModel):
    text: str


class TogglePostLikeRequest(BaseModel):
    username: str | None = None


class CaptureRecordResponse(BaseModel):
    id: str
    username: str | None = None
    event_id: str | None = None
    event_title: str | None = None
    original_image_url: str
    annotated_image_url: str
    source: str
    created_at: str


class CaptureListItemResponse(CaptureRecordResponse):
    status_label: str
    headline: str
    message: str
    has_detections: bool
    has_drinking_action: bool
    contains_beer: bool
    crown_eligible: bool
    drink_count: int
    drink_types: list[str] = Field(default_factory=list)
    top_drink: str | None = None
    top_confidence: float | None = None


class AnalyzeCaptureResponse(DetectImageResponse):
    capture: CaptureRecordResponse


class DeleteResponse(BaseModel):
    deleted: bool = True
