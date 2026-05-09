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


class PublicUserResponse(AppUserResponse):
    full_name: str
    crown_count: int = 0


class UserProfileResponse(AppUserResponse):
    full_name: str
    bio: str
    city: str
    email: str
    role: str


class PublicUserProfileResponse(AppUserResponse):
    full_name: str
    bio: str


class AuthSessionResponse(BaseModel):
    access_token: str
    token: str | None = None
    token_type: str = "bearer"
    user: UserProfileResponse


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    full_name: str
    city: str = ""
    bio: str = ""
    avatar_uri: str | None = None


class AuthChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class AuthProfileUpdateRequest(BaseModel):
    email: str | None = None
    username: str | None = None
    full_name: str | None = None
    city: str | None = None
    bio: str | None = None
    avatar_uri: str | None = None


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetChallengeResponse(BaseModel):
    ok: bool = True
    challenge_id: str | None = None
    debug_code: str | None = None
    reset_token: str | None = None
    message: str


class PasswordResetConfirmRequest(BaseModel):
    challenge_id: str
    code: str
    new_password: str


class PasswordResetConfirmResponse(BaseModel):
    ok: bool = True
    message: str


class UserSearchResultResponse(PublicUserResponse):
    friendship_status: str = "none"


class FriendRequestCreateRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=120)


class FriendRequestResponse(BaseModel):
    id: str
    status: str
    direction: str
    requester_user: PublicUserResponse
    addressee_user: PublicUserResponse
    created_at: str
    updated_at: str
    responded_at: str | None = None


class FriendRequestListResponse(BaseModel):
    incoming: list[FriendRequestResponse] = Field(default_factory=list)
    outgoing: list[FriendRequestResponse] = Field(default_factory=list)


class FriendListItemResponse(BaseModel):
    friendship_id: str
    friend: PublicUserResponse
    created_at: str
    updated_at: str


class GroupCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=500)
    invited_user_ids: list[str] = Field(default_factory=list)


class GroupUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class GroupInvitationRequest(BaseModel):
    user_ids: list[str] = Field(default_factory=list)


class GroupMemberUpdateRequest(BaseModel):
    role: str = Field(min_length=1, max_length=20)


class GroupSummaryResponse(BaseModel):
    id: str
    name: str
    description: str
    visibility: str
    owner_user_id: str
    created_at: str
    updated_at: str
    archived_at: str | None = None
    membership_role: str
    membership_status: str
    member_count: int = 0


class GroupMemberResponse(BaseModel):
    id: str
    user: PublicUserResponse
    role: str
    status: str
    invited_by_user_id: str | None = None
    joined_at: str | None = None
    created_at: str
    updated_at: str


class GroupDetailResponse(GroupSummaryResponse):
    current_user_role: str
    current_user_status: str
    members: list[GroupMemberResponse] = Field(default_factory=list)


class GroupListResponse(BaseModel):
    items: list[GroupSummaryResponse] = Field(default_factory=list)
    pending_invites: list[GroupSummaryResponse] = Field(default_factory=list)


class GroupLeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    display_name: str
    avatar_url: str
    crown_count: int
    period_crowns: int
    is_current_user: bool = False


class GroupLeaderboardResponse(BaseModel):
    group_id: str
    period: str
    generated_at: str
    entries: list[GroupLeaderboardEntryResponse] = Field(default_factory=list)


class EventPayload(BaseModel):
    id: str
    title: str
    short_title: str | None = None
    source_url: str | None = None
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


class EventSocialStateResponse(BaseModel):
    liked: bool
    saved: bool
    likes: list[AppUserResponse] = Field(default_factory=list)
    comments: list["PostCommentResponse"] = Field(default_factory=list)
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
    crown_awarded: bool | None = None
    crown_count: int | None = None


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


class SupportTicketResponse(BaseModel):
    id: str
    subject: str
    message: str
    email: str
    status: str
    priority: str
    created_at: str
    notification_status: str | None = None


class SupportTicketNoteResponse(BaseModel):
    id: str
    note: str
    is_internal: bool
    created_at: str
    author_user_id: str | None = None
    author_username: str | None = None


class SupportTicketDetailResponse(SupportTicketResponse):
    notes: list[SupportTicketNoteResponse] = Field(default_factory=list)


class SupportTicketUpdateRequest(BaseModel):
    status: str | None = None
    priority: str | None = None


class SupportTicketNoteCreateRequest(BaseModel):
    note: str = Field(min_length=1, max_length=4000)
    is_internal: bool = True


class SupportTicketListResponse(BaseModel):
    items: list[SupportTicketResponse] = Field(default_factory=list)
