"""API schemas for the EventCapture backend."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    ok: bool
    status: str
    environment: str
    version: str
    model_exists: bool
    custom_model_exists: bool
    database_exists: bool
    database_path: str


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
    database_path: str
    database_exists: bool
    media_dir: str


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
    crown_count: int = 0
    created_at: str
    updated_at: str


class AuthTokenResponse(BaseModel):
    token: str
    expires_at: str
    user: UserProfileResponse


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    full_name: str = Field(min_length=1, max_length=120)
    email: str
    password: str = Field(min_length=8, max_length=128)
    city: str = Field(min_length=1, max_length=80)
    bio: str = Field(default="", max_length=500)
    avatar_uri: str = Field(default="", max_length=2048)


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1, max_length=128)


class UpdateProfileRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    full_name: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=80)
    bio: str = Field(default="", max_length=500)
    avatar_uri: str = Field(default="", max_length=2048)
    email: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordRequestPayload(BaseModel):
    email: str


class ResetPasswordRequestResponse(BaseModel):
    message: str
    reset_token: str | None = None


class ResetPasswordConfirmRequest(BaseModel):
    token: str = Field(min_length=12, max_length=512)
    new_password: str = Field(min_length=8, max_length=128)


class EventPayload(BaseModel):
    id: str | None = None
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
    created_by_user_id: str | None = None


class EventCommentResponse(BaseModel):
    id: str
    user: AppUserResponse
    text: str
    time: str


class EventSocialStateResponse(BaseModel):
    liked: bool = False
    saved: bool = False
    likes: list[AppUserResponse] = Field(default_factory=list)
    comments: list[EventCommentResponse] = Field(default_factory=list)
    plan_status: str | None = None
    plan_note: str = ""


class EventSocialMapResponse(BaseModel):
    items: dict[str, EventSocialStateResponse] = Field(default_factory=dict)


class EventPlanListItemResponse(BaseModel):
    event_id: str
    saved: bool
    plan_status: str | None = None
    plan_note: str = ""


class EventPlanListResponse(BaseModel):
    items: list[EventPlanListItemResponse] = Field(default_factory=list)


class AddEventCommentRequest(BaseModel):
    text: str = Field(min_length=1, max_length=800)


class EventPlanRequest(BaseModel):
    status: str | None = None


class EventPlanNoteRequest(BaseModel):
    note: str = Field(default="", max_length=500)


class PostCommentResponse(BaseModel):
    id: str
    user: AppUserResponse
    text: str
    time: str


class PostPayload(BaseModel):
    id: str | None = None
    user: AppUserResponse | None = None
    image_uri: str
    date: str
    is_beer_finished: bool
    event_id: str | None = None
    event_title: str | None = None
    likes: list[str] = Field(default_factory=list)
    comments: list[PostCommentResponse] = Field(default_factory=list)
    capture_id: str | None = None
    crown_awarded: bool = False
    crown_count: int | None = None


class AddPostCommentRequest(BaseModel):
    text: str = Field(min_length=1, max_length=800)


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


class MessageResponse(BaseModel):
    message: str


class RewardTransactionResponse(BaseModel):
    id: str
    amount: int
    reason: str
    source_type: str
    source_id: str
    created_at: str


class RewardStateResponse(BaseModel):
    crown_count: int
    history: list[RewardTransactionResponse] = Field(default_factory=list)


class NotificationItemResponse(BaseModel):
    id: str
    actor_username: str
    actor_avatar_uri: str
    title: str
    message: str
    icon: str
    color: str
    related_type: str | None = None
    related_id: str | None = None
    is_read: bool = False
    created_at: str


class NotificationListResponse(BaseModel):
    items: list[NotificationItemResponse] = Field(default_factory=list)
    unread_count: int = 0


class ActivityNotificationRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=500)
    icon: str = Field(min_length=1, max_length=60)
    color: str = Field(min_length=1, max_length=20)
    related_type: str | None = Field(default=None, max_length=60)
    related_id: str | None = Field(default=None, max_length=120)


class SupportContactRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=10, max_length=4000)
    email: str | None = Field(default=None, max_length=320)


class SupportContactResponse(BaseModel):
    id: str
    message: str
