"""Database models and persistence helpers."""

from __future__ import annotations

import logging
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Callable

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine, func, or_, select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload, sessionmaker

try:
    from .config import settings
    from .security import generate_reset_code, hash_password, password_hash_needs_upgrade, verify_password
except ImportError:
    from config import settings
    from security import generate_reset_code, hash_password, password_hash_needs_upgrade, verify_password


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _coerce_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


logger = logging.getLogger(__name__)

NotificationEvent = dict[str, object]
NotificationEventListener = Callable[[NotificationEvent], None]
_notification_event_listener: NotificationEventListener | None = None


def _new_prefixed_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def _new_uuid() -> str:
    return uuid.uuid4().hex


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    bio: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str] = mapped_column(String(255), default="")
    avatar_uri: Mapped[str] = mapped_column(Text, default="")
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(16), default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    posts: Mapped[list["Post"]] = relationship(back_populates="user")
    likes: Mapped[list["PostLike"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list["PostComment"]] = relationship(back_populates="user")
    outgoing_friend_requests: Mapped[list["FriendRequest"]] = relationship(
        foreign_keys="FriendRequest.requester_user_id",
        back_populates="requester_user",
        cascade="all, delete-orphan",
    )
    incoming_friend_requests: Mapped[list["FriendRequest"]] = relationship(
        foreign_keys="FriendRequest.addressee_user_id",
        back_populates="addressee_user",
        cascade="all, delete-orphan",
    )
    activity_notifications: Mapped[list["ActivityNotification"]] = relationship(
        foreign_keys="ActivityNotification.user_id",
        cascade="all, delete-orphan",
    )
    group_memberships: Mapped[list["GroupMember"]] = relationship(
        foreign_keys="GroupMember.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    short_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date: Mapped[str] = mapped_column(String(64))
    full_date: Mapped[str] = mapped_column(String(128))
    time: Mapped[str] = mapped_column(String(64))
    place: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(255))
    attendees: Mapped[str] = mapped_column(String(255))
    attendee_count: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[str] = mapped_column(String(128))
    price_label: Mapped[str] = mapped_column(String(128))
    vibe: Mapped[str] = mapped_column(String(255))
    experience: Mapped[str] = mapped_column(String(255))
    hero_image: Mapped[str] = mapped_column(Text)
    host_name: Mapped[str] = mapped_column(String(255))
    host_avatar: Mapped[str] = mapped_column(Text)
    badge: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    tags_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    image_uri: Mapped[str] = mapped_column(Text)
    date: Mapped[str] = mapped_column(String(64))
    is_beer_finished: Mapped[bool] = mapped_column(Boolean, default=False)
    event_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    event_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    capture_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    user: Mapped[User] = relationship(back_populates="posts")
    likes: Mapped[list["PostLike"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostLike.created_at.asc()",
    )
    comments: Mapped[list["PostComment"]] = relationship(
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="PostComment.created_at.desc()",
    )


class PostLike(Base):
    __tablename__ = "post_likes"

    post_id: Mapped[str] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)

    post: Mapped[Post] = relationship(back_populates="likes")
    user: Mapped[User] = relationship(back_populates="likes")


class PostComment(Base):
    __tablename__ = "post_comments"

    id: Mapped[str] = mapped_column(String(128), primary_key=True, default=lambda: _new_prefixed_id("comment"))
    post_id: Mapped[str] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(Text)
    time_label: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)

    post: Mapped[Post] = relationship(back_populates="comments")
    user: Mapped[User] = relationship(back_populates="comments")


class Capture(Base):
    __tablename__ = "captures"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    event_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    event_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_media_path: Mapped[str] = mapped_column(Text)
    annotated_media_path: Mapped[str] = mapped_column(Text)
    status_label: Mapped[str] = mapped_column(String(64))
    headline: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    has_detections: Mapped[bool] = mapped_column(Boolean)
    has_drinking_action: Mapped[bool] = mapped_column(Boolean)
    contains_beer: Mapped[bool] = mapped_column(Boolean)
    crown_eligible: Mapped[bool] = mapped_column(Boolean)
    drink_count: Mapped[int] = mapped_column(Integer)
    drink_types_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    top_drink: Mapped[str | None] = mapped_column(String(128), nullable=True)
    top_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, index=True)

    detections: Mapped[list["CaptureDetection"]] = relationship(
        back_populates="capture",
        cascade="all, delete-orphan",
    )


class CaptureDetection(Base):
    __tablename__ = "capture_detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    capture_id: Mapped[str] = mapped_column(ForeignKey("captures.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(128))
    drink_type: Mapped[str] = mapped_column(String(128))
    confidence: Mapped[float] = mapped_column(Float)
    bbox_json: Mapped[list[int]] = mapped_column(JSON)
    is_drinking: Mapped[bool] = mapped_column(Boolean, default=False)

    capture: Mapped[Capture] = relationship(back_populates="detections")


class PasswordResetChallenge(Base):
    __tablename__ = "password_reset_challenges"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    code_hash: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)


class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_uuid)
    requester_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    addressee_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    requester_user: Mapped[User] = relationship(foreign_keys=[requester_user_id], back_populates="outgoing_friend_requests")
    addressee_user: Mapped[User] = relationship(foreign_keys=[addressee_user_id], back_populates="incoming_friend_requests")


class Friendship(Base):
    __tablename__ = "friendships"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: _new_prefixed_id("friend"))
    requester_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    addressee_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    pair_key: Mapped[str] = mapped_column(String(96), index=True)
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    requester_user: Mapped[User] = relationship(foreign_keys=[requester_user_id])
    addressee_user: Mapped[User] = relationship(foreign_keys=[addressee_user_id])


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: _new_prefixed_id("group"))
    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text, default="")
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    visibility: Mapped[str] = mapped_column(String(32), default="invite_only")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner_user: Mapped[User] = relationship(foreign_keys=[owner_user_id])
    members: Mapped[list["GroupMember"]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="GroupMember.created_at.asc()",
    )


class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: _new_prefixed_id("groupmember"))
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    status: Mapped[str] = mapped_column(String(20), default="invited", index=True)
    invited_by_user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    group: Mapped[Group] = relationship(back_populates="members")
    user: Mapped[User] = relationship(foreign_keys=[user_id], back_populates="group_memberships")
    invited_by_user: Mapped[User | None] = relationship(foreign_keys=[invited_by_user_id])


class ActivityNotification(Base):
    __tablename__ = "activity_notifications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(64), default="notifications-outline")
    color: Mapped[str] = mapped_column(String(32), default="#f97316")
    related_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    related_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, index=True)

    actor_user: Mapped[User | None] = relationship(foreign_keys=[actor_user_id])


def _create_engine() -> Engine:
    connect_args: dict[str, Any] = {}
    if settings.database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_engine(
        settings.database_url,
        echo=settings.database_echo,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


@dataclass(frozen=True)
class PasswordResetRequestResult:
    challenge_id: str | None
    code: str | None
    debug_code: str | None


@contextmanager
def session_scope() -> Any:
    session = SessionLocal()
    try:
        yield session
        session.commit()
        _dispatch_session_events(session)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def set_notification_event_listener(listener: NotificationEventListener | None) -> None:
    global _notification_event_listener
    _notification_event_listener = listener


def _append_session_notification_event(session: Session, event: NotificationEvent) -> None:
    session.info.setdefault("notification_events", []).append(event)


def _dispatch_session_events(session: Session) -> None:
    if _notification_event_listener is None:
        return

    events = list(session.info.pop("notification_events", []))
    for event in events:
        try:
            _notification_event_listener(event)
        except Exception:
            logger.exception("Failed to dispatch notification event.")


def init_database() -> None:
    _migrate_friendships_table_if_needed()
    Base.metadata.create_all(bind=engine)
    bootstrap_default_users()
    _cleanup_invalid_avatar_uris()


def check_database_connection() -> bool:
    with engine.connect() as connection:
        connection.execute(select(1))
    return True


def _serialize_user(user: User) -> dict[str, object]:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "bio": user.bio,
        "city": user.city,
        "email": user.email,
        "avatar_uri": user.avatar_uri,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


def _serialize_public_user(user: User) -> dict[str, object]:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_uri": user.avatar_uri,
        "crown_count": _count_public_user_crowns(user),
    }


def _serialize_public_user_profile(user: User) -> dict[str, object]:
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_uri": user.avatar_uri,
        "bio": user.bio,
    }


def _serialize_friend_request(request: Friendship, *, current_user_id: str) -> dict[str, object]:
    direction = "incoming" if request.addressee_user_id == current_user_id else "outgoing"
    return {
        "id": request.id,
        "status": request.status,
        "direction": direction,
        "requester_user": _serialize_public_user(request.requester_user),  # type: ignore[attr-defined]
        "addressee_user": _serialize_public_user(request.addressee_user),  # type: ignore[attr-defined]
        "created_at": request.created_at.isoformat(),
        "updated_at": request.updated_at.isoformat(),
        "responded_at": request.responded_at.isoformat() if request.responded_at else None,
    }


def _serialize_friendship(friendship: Friendship, *, current_user_id: str) -> dict[str, object]:
    friend = friendship.addressee_user if friendship.requester_user_id == current_user_id else friendship.requester_user  # type: ignore[attr-defined]
    return {
        "friendship_id": friendship.id,
        "friend": _serialize_public_user(friend),
        "created_at": friendship.created_at.isoformat(),
        "updated_at": friendship.updated_at.isoformat(),
    }


def _serialize_notification(notification: ActivityNotification) -> dict[str, object]:
    actor = notification.actor_user  # type: ignore[attr-defined]
    return {
        "id": notification.id,
        "actor_user_id": actor.id if actor is not None else None,
        "actor_username": actor.username if actor is not None else "EventCapture",
        "actor_avatar_uri": actor.avatar_uri if actor is not None else "",
        "title": notification.title,
        "message": notification.message,
        "icon": notification.icon,
        "color": notification.color,
        "related_type": notification.related_type,
        "related_id": notification.related_id,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


def _count_unread_notifications(session: Session, user_id: str) -> int:
    return int(
        session.scalar(
            select(func.count(ActivityNotification.id)).where(
                ActivityNotification.user_id == user_id,
                ActivityNotification.is_read == False,  # noqa: E712
            )
        )
        or 0
    )


def _serialize_event(event: Event) -> dict[str, object]:
    return {
        "id": event.id,
        "title": event.title,
        "short_title": event.short_title,
        "date": event.date,
        "full_date": event.full_date,
        "time": event.time,
        "place": event.place,
        "address": event.address,
        "attendees": event.attendees,
        "attendee_count": event.attendee_count,
        "price": event.price,
        "price_label": event.price_label,
        "vibe": event.vibe,
        "experience": event.experience,
        "hero_image": event.hero_image,
        "host_name": event.host_name,
        "host_avatar": event.host_avatar,
        "badge": event.badge,
        "description": event.description,
        "tags": event.tags_json or [],
    }


def _serialize_post(post: Post) -> dict[str, object]:
    return {
        "id": post.id,
        "user": {
            "id": post.user.id,
            "username": post.user.username,
            "avatar_uri": post.user.avatar_uri,
        },
        "image_uri": post.image_uri,
        "date": post.date,
        "is_beer_finished": post.is_beer_finished,
        "event_id": post.event_id,
        "event_title": post.event_title,
        "likes": [like.user.username for like in post.likes],
        "comments": [
            {
                "id": comment.id,
                "user": {
                    "id": comment.user.id,
                    "username": comment.user.username,
                    "avatar_uri": comment.user.avatar_uri,
                },
                "text": comment.text,
                "time": comment.time_label,
            }
            for comment in post.comments
        ],
        "capture_id": post.capture_id,
    }


def _serialize_capture(capture: Capture) -> dict[str, object]:
    return {
        "id": capture.id,
        "username": capture.username,
        "event_id": capture.event_id,
        "event_title": capture.event_title,
        "original_media_path": capture.original_media_path,
        "annotated_media_path": capture.annotated_media_path,
        "status_label": capture.status_label,
        "headline": capture.headline,
        "message": capture.message,
        "has_detections": capture.has_detections,
        "has_drinking_action": capture.has_drinking_action,
        "contains_beer": capture.contains_beer,
        "crown_eligible": capture.crown_eligible,
        "drink_count": capture.drink_count,
        "drink_types": capture.drink_types_json or [],
        "top_drink": capture.top_drink,
        "top_confidence": capture.top_confidence,
        "source": capture.source,
        "created_at": capture.created_at.isoformat(),
    }


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _friend_pair_key(user_a_id: str, user_b_id: str) -> str:
    left, right = sorted((user_a_id, user_b_id))
    return f"{left}:{right}"


def _count_public_user_crowns(user: User) -> int:
    return sum(1 for post in user.posts if post.is_beer_finished)


def _is_invalid_persisted_avatar_uri(value: str | None) -> bool:
    if not value:
        return False

    trimmed = value.strip()
    if not trimmed:
        return False

    lowered = trimmed.lower()
    if lowered.startswith(("blob:", "file:", "content://", "/data/user/", "/var/mobile/")):
        return True
    if len(trimmed) >= 3 and trimmed[1:3] == ":\\" and trimmed[0].isalpha():
        return True
    return False


def _sanitize_avatar_uri(value: str | None) -> str:
    trimmed = (value or "").strip()
    if not trimmed or _is_invalid_persisted_avatar_uri(trimmed):
        return ""
    return trimmed


def _visible_group_statuses() -> tuple[str, ...]:
    return ("accepted", "invited")


def _active_group_member_count(members: list[GroupMember]) -> int:
    return sum(1 for member in members if member.status in _visible_group_statuses())


def _serialize_group_member(member: GroupMember) -> dict[str, object]:
    return {
        "id": member.id,
        "user": _serialize_public_user(member.user),  # type: ignore[attr-defined]
        "role": member.role,
        "status": member.status,
        "invited_by_user_id": member.invited_by_user_id,
        "joined_at": member.joined_at.isoformat() if member.joined_at else None,
        "created_at": member.created_at.isoformat(),
        "updated_at": member.updated_at.isoformat(),
    }


def _serialize_group_summary(group: Group, membership: GroupMember, *, members: list[GroupMember]) -> dict[str, object]:
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "visibility": group.visibility,
        "owner_user_id": group.owner_user_id,
        "created_at": group.created_at.isoformat(),
        "updated_at": group.updated_at.isoformat(),
        "archived_at": group.archived_at.isoformat() if group.archived_at else None,
        "membership_role": membership.role,
        "membership_status": membership.status,
        "member_count": _active_group_member_count(members),
    }


def _serialize_group_detail(group: Group, membership: GroupMember, *, members: list[GroupMember]) -> dict[str, object]:
    payload = _serialize_group_summary(group, membership, members=members)
    payload.update(
        current_user_role=membership.role,
        current_user_status=membership.status,
        members=[_serialize_group_member(member) for member in members if member.status in _visible_group_statuses()],
    )
    return payload


def _create_notification(
    session: Session,
    *,
    user_id: str,
    actor_user_id: str | None,
    title: str,
    message: str,
    icon: str,
    color: str,
    related_type: str | None = None,
    related_id: str | None = None,
) -> ActivityNotification:
    notification = ActivityNotification(
        user_id=user_id,
        actor_user_id=actor_user_id,
        title=title,
        message=message,
        icon=icon,
        color=color,
        related_type=related_type,
        related_id=related_id,
    )
    session.add(notification)
    session.flush()
    notification = session.scalars(
        select(ActivityNotification)
        .options(selectinload(ActivityNotification.actor_user))
        .where(ActivityNotification.id == notification.id)
    ).one()
    _append_session_notification_event(
        session,
        {
            "type": "notification.created",
            "user_id": user_id,
            "item": _serialize_notification(notification),
            "unread_count": _count_unread_notifications(session, user_id),
        },
    )
    return notification


def _migrate_friendships_table_if_needed() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as connection:
        existing_columns = [
            str(row[1])
            for row in connection.exec_driver_sql("PRAGMA table_info(friendships)").fetchall()
        ]
        if not existing_columns or "pair_key" in existing_columns:
            return
        if "user_low_id" not in existing_columns or "user_high_id" not in existing_columns:
            return

        backup_table = "friendships_pre_social_fix"
        connection.exec_driver_sql(f"DROP TABLE IF EXISTS {backup_table}")
        connection.exec_driver_sql(f"ALTER TABLE friendships RENAME TO {backup_table}")
        connection.exec_driver_sql(
            """
            CREATE TABLE friendships (
                id TEXT PRIMARY KEY,
                requester_user_id TEXT NOT NULL,
                addressee_user_id TEXT NOT NULL,
                pair_key TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                responded_at TEXT
            )
            """
        )
        connection.exec_driver_sql(
            f"""
            INSERT INTO friendships (
                id,
                requester_user_id,
                addressee_user_id,
                pair_key,
                status,
                created_at,
                updated_at,
                responded_at
            )
            SELECT
                id,
                user_low_id,
                user_high_id,
                CASE
                    WHEN user_low_id < user_high_id THEN user_low_id || ':' || user_high_id
                    ELSE user_high_id || ':' || user_low_id
                END,
                'accepted',
                created_at,
                updated_at,
                updated_at
            FROM {backup_table}
            """
        )
        connection.exec_driver_sql(f"DROP TABLE {backup_table}")


def _cleanup_invalid_avatar_uris() -> None:
    with session_scope() as session:
        users = session.scalars(select(User)).all()
        changed = False
        for user in users:
            normalized_avatar_uri = _sanitize_avatar_uri(user.avatar_uri)
            if user.avatar_uri != normalized_avatar_uri:
                user.avatar_uri = normalized_avatar_uri
                user.updated_at = _utc_now()
                changed = True
        if changed:
            session.flush()


def _get_friendship_record(session: Session, user_a_id: str, user_b_id: str) -> Friendship | None:
    return session.scalars(
        select(Friendship).where(Friendship.pair_key == _friend_pair_key(user_a_id, user_b_id))
    ).first()


def _friendship_exists(session: Session, user_a_id: str, user_b_id: str) -> bool:
    friendship = _get_friendship_record(session, user_a_id, user_b_id)
    return friendship is not None and friendship.status == "accepted"


def _load_friendship_request(session: Session, request_id: str) -> Friendship | None:
    return session.scalars(
        select(Friendship)
        .options(
            selectinload(Friendship.requester_user).selectinload(User.posts),
            selectinload(Friendship.addressee_user).selectinload(User.posts),
        )
        .where(Friendship.id == request_id)
    ).first()


def _load_group(session: Session, group_id: str) -> Group:
    group = session.scalars(select(Group).where(Group.id == group_id, Group.archived_at.is_(None))).first()
    if group is None:
        raise KeyError(group_id)
    return group


def _get_group_membership(session: Session, group_id: str, user_id: str) -> GroupMember | None:
    return session.scalars(
        select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
    ).first()


def _load_group_members(session: Session, group_id: str) -> list[GroupMember]:
    members = session.scalars(
        select(GroupMember)
        .options(selectinload(GroupMember.user).selectinload(User.posts))
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.created_at.asc(), GroupMember.id.asc())
    ).all()

    role_order = {"owner": 0, "admin": 1, "member": 2}
    status_order = {"accepted": 0, "invited": 1, "declined": 2, "removed": 3}
    return sorted(
        members,
        key=lambda member: (
            status_order.get(member.status, 9),
            role_order.get(member.role, 9),
            member.user.username.lower(),
        ),
    )


def _load_group_detail(session: Session, group_id: str, current_user_id: str) -> tuple[Group, GroupMember, list[GroupMember]]:
    group = _load_group(session, group_id)
    membership = _get_group_membership(session, group.id, current_user_id)
    if membership is None or membership.status not in _visible_group_statuses():
        raise PermissionError("You do not have access to this group.")
    members = _load_group_members(session, group.id)
    return group, membership, members


def search_users_for_friendship(query: str, current_user_id: str) -> list[dict[str, object]]:
    normalized_query = query.strip().lower()
    if len(normalized_query) < 2:
        return []

    with session_scope() as session:
        current_user = _get_user(session, current_user_id)
        users = session.scalars(
            select(User)
            .options(selectinload(User.posts))
            .where(User.is_active == True)  # noqa: E712
            .order_by(User.username.asc())
        ).all()

        results: list[dict[str, object]] = []
        for user in users:
            if user.id == current_user.id:
                continue
            haystack = " ".join((user.username, user.full_name, user.email)).lower()
            if normalized_query not in haystack:
                continue

            friendship_status = "none"
            friendship = _get_friendship_record(session, current_user.id, user.id)
            if friendship is not None:
                if friendship.status == "accepted":
                    friendship_status = "accepted"
                elif friendship.status == "pending":
                    friendship_status = (
                        "outgoing_pending"
                        if friendship.requester_user_id == current_user.id
                        else "incoming_pending"
                    )

            entry = _serialize_public_user(user)
            entry["friendship_status"] = friendship_status
            results.append(entry)

        return results


def list_friend_requests(user_id: str) -> dict[str, list[dict[str, object]]]:
    with session_scope() as session:
        _get_user(session, user_id)
        requests = session.scalars(
            select(Friendship)
            .options(
                selectinload(Friendship.requester_user).selectinload(User.posts),
                selectinload(Friendship.addressee_user).selectinload(User.posts),
            )
            .where(
                Friendship.status == "pending",
                or_(Friendship.requester_user_id == user_id, Friendship.addressee_user_id == user_id),
            )
            .order_by(Friendship.created_at.desc())
        ).all()
        incoming = [_serialize_friend_request(item, current_user_id=user_id) for item in requests if item.addressee_user_id == user_id]
        outgoing = [_serialize_friend_request(item, current_user_id=user_id) for item in requests if item.requester_user_id == user_id]
        return {"incoming": incoming, "outgoing": outgoing}


def create_friend_request(acting_user_id: str, target_user_id: str) -> dict[str, object]:
    with session_scope() as session:
        requester = _get_user(session, acting_user_id)
        addressee = _get_user(session, target_user_id)
        if requester.id == addressee.id:
            raise ValueError("You cannot send a friend request to yourself.")
        existing_request = _get_friendship_record(session, requester.id, addressee.id)
        if existing_request is not None:
            if existing_request.status == "accepted":
                raise ValueError("You are already friends with that user.")
            if existing_request.status == "pending":
                raise ValueError("A pending friend request already exists.")
            request = existing_request
            request.requester_user_id = requester.id
            request.addressee_user_id = addressee.id
            request.status = "pending"
            request.responded_at = None
            request.updated_at = _utc_now()
        else:
            request = Friendship(
                requester_user_id=requester.id,
                addressee_user_id=addressee.id,
                pair_key=_friend_pair_key(requester.id, addressee.id),
                status="pending",
            )
            session.add(request)

        session.flush()
        _create_notification(
            session,
            user_id=addressee.id,
            actor_user_id=requester.id,
            title="Friend request received",
            message=f"{requester.username} sent you a friend request.",
            icon="people-outline",
            color="#f97316",
            related_type="friendship_request",
            related_id=request.id,
        )
        session.flush()
        request = _load_friendship_request(session, request.id)
        assert request is not None
        return _serialize_friend_request(request, current_user_id=acting_user_id)


def respond_to_friend_request(acting_user_id: str, request_id: str, *, accept: bool) -> dict[str, object]:
    with session_scope() as session:
        _get_user(session, acting_user_id)
        request = _load_friendship_request(session, request_id)
        if request is None:
            raise KeyError(request_id)
        if request.addressee_user_id != acting_user_id:
            raise PermissionError("You do not have permission to respond to this request.")
        if request.status != "pending":
            raise ValueError("That friend request has already been handled.")

        request.status = "accepted" if accept else "declined"
        request.responded_at = _utc_now()
        request.updated_at = _utc_now()

        if accept:
            _create_notification(
                session,
                user_id=request.requester_user_id,
                actor_user_id=acting_user_id,
                title="Friend request accepted",
                message=f"{request.addressee_user.username} accepted your friend request.",
                icon="people",
                color="#22c55e",
                related_type="friendship",
                related_id=request.id,
            )
            _create_notification(
                session,
                user_id=acting_user_id,
                actor_user_id=request.requester_user_id,
                title="Friendship confirmed",
                message=f"You are now friends with {request.requester_user.username}.",
                icon="people",
                color="#22c55e",
                related_type="friendship",
                related_id=request.id,
            )

        session.flush()
        request = _load_friendship_request(session, request.id)
        assert request is not None
        return _serialize_friend_request(request, current_user_id=acting_user_id)


def list_friends(user_id: str) -> list[dict[str, object]]:
    with session_scope() as session:
        _get_user(session, user_id)
        friendships = session.scalars(
            select(Friendship)
            .options(
                selectinload(Friendship.requester_user).selectinload(User.posts),
                selectinload(Friendship.addressee_user).selectinload(User.posts),
            )
            .where(
                Friendship.status == "accepted",
                or_(Friendship.requester_user_id == user_id, Friendship.addressee_user_id == user_id),
            )
            .order_by(Friendship.created_at.desc())
        ).all()
        return [_serialize_friendship(item, current_user_id=user_id) for item in friendships]


def remove_friend(acting_user_id: str, friend_user_id: str) -> bool:
    with session_scope() as session:
        _get_user(session, acting_user_id)
        _get_user(session, friend_user_id)
        friendship = _get_friendship_record(session, acting_user_id, friend_user_id)
        if friendship is None or friendship.status != "accepted":
            return False
        session.delete(friendship)
        return True


def list_groups(user_id: str) -> dict[str, list[dict[str, object]]]:
    with session_scope() as session:
        _get_user(session, user_id)
        memberships = session.scalars(
            select(GroupMember)
            .join(Group, Group.id == GroupMember.group_id)
            .options(selectinload(GroupMember.group))
            .where(
                GroupMember.user_id == user_id,
                Group.archived_at.is_(None),
                GroupMember.status.in_(_visible_group_statuses()),
            )
            .order_by(Group.updated_at.desc(), Group.created_at.desc())
        ).all()

        group_ids = [membership.group_id for membership in memberships]
        members_by_group_id: dict[str, list[GroupMember]] = {}
        if group_ids:
            all_members = session.scalars(
                select(GroupMember)
                .options(selectinload(GroupMember.user).selectinload(User.posts))
                .where(GroupMember.group_id.in_(group_ids))
            ).all()
            for member in all_members:
                members_by_group_id.setdefault(member.group_id, []).append(member)

        accepted: list[dict[str, object]] = []
        invited: list[dict[str, object]] = []
        for membership in memberships:
            group = membership.group  # type: ignore[attr-defined]
            members = members_by_group_id.get(group.id, [])
            payload = _serialize_group_summary(group, membership, members=members)
            if membership.status == "accepted":
                accepted.append(payload)
            elif membership.status == "invited":
                invited.append(payload)

        return {"items": accepted, "pending_invites": invited}


def get_group_detail(group_id: str, current_user_id: str) -> dict[str, object]:
    with session_scope() as session:
        group, membership, members = _load_group_detail(session, group_id, current_user_id)
        return _serialize_group_detail(group, membership, members=members)


def create_group(acting_user_id: str, *, name: str, description: str, invited_user_ids: list[str]) -> dict[str, object]:
    with session_scope() as session:
        owner = _get_user(session, acting_user_id)
        group = Group(
            name=name.strip(),
            description=description.strip(),
            owner_user_id=owner.id,
            visibility="invite_only",
        )
        session.add(group)
        session.flush()

        owner_membership = GroupMember(
            group_id=group.id,
            user_id=owner.id,
            role="owner",
            status="accepted",
            invited_by_user_id=owner.id,
            joined_at=_utc_now(),
        )
        session.add(owner_membership)
        session.flush()

        _apply_group_invites(session, group=group, acting_user=owner, user_ids=invited_user_ids)
        session.flush()
        group, membership, members = _load_group_detail(session, group.id, owner.id)
        return _serialize_group_detail(group, membership, members=members)


def update_group(group_id: str, acting_user_id: str, *, name: str | None = None, description: str | None = None) -> dict[str, object]:
    with session_scope() as session:
        group, membership, _members = _load_group_detail(session, group_id, acting_user_id)
        if membership.status != "accepted" or membership.role not in {"owner", "admin"}:
            raise PermissionError("You do not have permission to update this group.")

        if name is not None and name.strip():
            group.name = name.strip()
        if description is not None:
            group.description = description.strip()
        group.updated_at = _utc_now()
        session.flush()
        group, membership, members = _load_group_detail(session, group.id, acting_user_id)
        return _serialize_group_detail(group, membership, members=members)


def archive_group(group_id: str, acting_user_id: str) -> bool:
    with session_scope() as session:
        group, membership, _members = _load_group_detail(session, group_id, acting_user_id)
        if membership.role != "owner" or membership.status != "accepted":
            raise PermissionError("Only the group owner can archive this group.")
        group.archived_at = _utc_now()
        group.updated_at = _utc_now()
        return True


def _apply_group_invites(session: Session, *, group: Group, acting_user: User, user_ids: list[str]) -> None:
    unique_user_ids = list(dict.fromkeys(user_id for user_id in user_ids if user_id))
    for target_user_id in unique_user_ids:
        if target_user_id == acting_user.id:
            continue
        if not _friendship_exists(session, acting_user.id, target_user_id):
            raise ValueError("You can only invite users who are already your friends.")

        target_user = _get_user(session, target_user_id)
        existing = _get_group_membership(session, group.id, target_user.id)
        if existing is not None and existing.status in {"accepted", "invited"}:
            continue

        if existing is None:
            existing = GroupMember(
                group_id=group.id,
                user_id=target_user.id,
                role="member",
                status="invited",
                invited_by_user_id=acting_user.id,
            )
            session.add(existing)
        else:
            existing.role = "member"
            existing.status = "invited"
            existing.invited_by_user_id = acting_user.id
            existing.joined_at = None
            existing.updated_at = _utc_now()

        session.flush()
        _create_notification(
            session,
            user_id=target_user.id,
            actor_user_id=acting_user.id,
            title="Group invite",
            message=f"{acting_user.username} invited you to join {group.name}.",
            icon="people-circle-outline",
            color="#f97316",
            related_type="group",
            related_id=group.id,
        )


def invite_group_members(group_id: str, acting_user_id: str, user_ids: list[str]) -> dict[str, object]:
    with session_scope() as session:
        acting_user = _get_user(session, acting_user_id)
        group, membership, _members = _load_group_detail(session, group_id, acting_user_id)
        if membership.status != "accepted" or membership.role not in {"owner", "admin"}:
            raise PermissionError("You do not have permission to invite members to this group.")
        _apply_group_invites(session, group=group, acting_user=acting_user, user_ids=user_ids)
        session.flush()
        group, membership, members = _load_group_detail(session, group.id, acting_user_id)
        return _serialize_group_detail(group, membership, members=members)


def accept_group_invite(group_id: str, acting_user_id: str) -> dict[str, object]:
    with session_scope() as session:
        _load_group(session, group_id)
        membership = _get_group_membership(session, group_id, acting_user_id)
        if membership is None or membership.status != "invited":
            raise PermissionError("You do not have an invitation for this group.")
        membership.status = "accepted"
        membership.joined_at = membership.joined_at or _utc_now()
        membership.updated_at = _utc_now()
        session.flush()
        group, membership, members = _load_group_detail(session, group_id, acting_user_id)
        return _serialize_group_detail(group, membership, members=members)


def decline_group_invite(group_id: str, acting_user_id: str) -> bool:
    with session_scope() as session:
        _load_group(session, group_id)
        membership = _get_group_membership(session, group_id, acting_user_id)
        if membership is None or membership.status != "invited":
            raise PermissionError("You do not have an invitation for this group.")
        membership.status = "declined"
        membership.updated_at = _utc_now()
        return True


def list_group_members(group_id: str, current_user_id: str) -> list[dict[str, object]]:
    with session_scope() as session:
        _group, _membership, members = _load_group_detail(session, group_id, current_user_id)
        return [_serialize_group_member(member) for member in members if member.status in _visible_group_statuses()]


def remove_group_member(group_id: str, acting_user_id: str, target_user_id: str) -> bool:
    with session_scope() as session:
        _group, membership, _members = _load_group_detail(session, group_id, acting_user_id)
        target_membership = _get_group_membership(session, group_id, target_user_id)
        if target_membership is None or target_membership.status not in _visible_group_statuses():
            raise KeyError(target_user_id)

        if target_user_id == acting_user_id:
            if membership.role == "owner":
                raise ValueError("Group owners cannot leave their own group. Archive it instead.")
            session.delete(target_membership)
            return True

        if membership.role == "owner":
            if target_membership.role == "owner":
                raise PermissionError("Group owners cannot remove themselves from the group.")
        elif membership.role == "admin":
            if target_membership.role != "member":
                raise PermissionError("Admins can only remove group members.")
        else:
            raise PermissionError("You do not have permission to remove members from this group.")

        session.delete(target_membership)
        return True


def update_group_member_role(group_id: str, acting_user_id: str, target_user_id: str, role: str) -> dict[str, object]:
    if role not in {"admin", "member"}:
        raise ValueError("Group role must be either admin or member.")

    with session_scope() as session:
        group, membership, _members = _load_group_detail(session, group_id, acting_user_id)
        if membership.role != "owner" or membership.status != "accepted":
            raise PermissionError("Only the group owner can update member roles.")

        target_membership = _get_group_membership(session, group.id, target_user_id)
        if target_membership is None or target_membership.status != "accepted":
            raise KeyError(target_user_id)
        if target_membership.role == "owner":
            raise ValueError("The group owner role cannot be changed.")

        target_membership.role = role
        target_membership.updated_at = _utc_now()
        session.flush()
        group, membership, members = _load_group_detail(session, group.id, acting_user_id)
        return _serialize_group_detail(group, membership, members=members)


def get_group_leaderboard(group_id: str, current_user_id: str, *, period: str) -> dict[str, object]:
    valid_periods = {"all_time", "weekly", "monthly"}
    if period not in valid_periods:
        raise ValueError("Leaderboard period must be one of all_time, weekly, or monthly.")

    with session_scope() as session:
        group, membership, members = _load_group_detail(session, group_id, current_user_id)
        if membership.status != "accepted":
            raise PermissionError("You must accept the invitation before viewing this leaderboard.")

        accepted_members = [member for member in members if member.status == "accepted"]
        member_ids = [member.user_id for member in accepted_members]
        posts = session.scalars(
            select(Post)
            .where(
                Post.user_id.in_(member_ids),
                Post.is_beer_finished == True,  # noqa: E712
            )
            .order_by(Post.created_at.desc())
        ).all()

        cutoff: datetime | None = None
        if period == "weekly":
            cutoff = _utc_now() - timedelta(days=7)
        elif period == "monthly":
            cutoff = _utc_now() - timedelta(days=30)

        all_time_counts = {member.user_id: 0 for member in accepted_members}
        period_counts = {member.user_id: 0 for member in accepted_members}
        for post in posts:
            all_time_counts[post.user_id] = all_time_counts.get(post.user_id, 0) + 1
            if cutoff is None or _coerce_utc_datetime(post.created_at) >= cutoff:
                period_counts[post.user_id] = period_counts.get(post.user_id, 0) + 1

        ranked_members = sorted(
            accepted_members,
            key=lambda member: (
                -period_counts.get(member.user_id, 0),
                -all_time_counts.get(member.user_id, 0),
                member.user.username.lower(),
            ),
        )
        entries: list[dict[str, object]] = []
        for index, member in enumerate(ranked_members, start=1):
            display_name = member.user.full_name.strip() or member.user.username
            entries.append(
                {
                    "rank": index,
                    "user_id": member.user_id,
                    "display_name": display_name,
                    "avatar_url": member.user.avatar_uri,
                    "crown_count": all_time_counts.get(member.user_id, 0),
                    "period_crowns": period_counts.get(member.user_id, 0),
                    "is_current_user": member.user_id == current_user_id,
                }
            )

        return {
            "group_id": group.id,
            "period": period,
            "generated_at": _utc_now().isoformat(),
            "entries": entries,
        }


def list_notifications(user_id: str) -> dict[str, object]:
    with session_scope() as session:
        _get_user(session, user_id)
        items = session.scalars(
            select(ActivityNotification)
            .options(selectinload(ActivityNotification.actor_user))
            .where(ActivityNotification.user_id == user_id)
            .order_by(ActivityNotification.created_at.desc())
        ).all()
        return {
            "items": [_serialize_notification(item) for item in items],
            "unread_count": sum(1 for item in items if not item.is_read),
        }


def mark_all_notifications_read(user_id: str) -> None:
    with session_scope() as session:
        _get_user(session, user_id)
        items = session.scalars(select(ActivityNotification).where(ActivityNotification.user_id == user_id, ActivityNotification.is_read == False)).all()  # noqa: E712
        for item in items:
            item.is_read = True
        _append_session_notification_event(
            session,
            {
                "type": "notification.read_all",
                "user_id": user_id,
                "unread_count": 0,
            },
        )


def create_activity_notification(
    acting_user_id: str,
    *,
    title: str,
    message: str,
    icon: str,
    color: str,
    related_type: str | None = None,
    related_id: str | None = None,
) -> dict[str, object]:
    with session_scope() as session:
        actor = _get_user(session, acting_user_id)
        notification = _create_notification(
            session,
            user_id=actor.id,
            actor_user_id=actor.id,
            title=title,
            message=message,
            icon=icon,
            color=color,
            related_type=related_type,
            related_id=related_id,
        )
        session.flush()
        notification = session.scalars(
            select(ActivityNotification)
            .options(selectinload(ActivityNotification.actor_user))
            .where(ActivityNotification.id == notification.id)
        ).one()
        return _serialize_notification(notification)


def get_rewards_summary(user_id: str) -> dict[str, object]:
    with session_scope() as session:
        _get_user(session, user_id)
        reward_posts = session.scalars(
            select(Post)
            .where(
                Post.user_id == user_id,
                Post.is_beer_finished == True,  # noqa: E712
            )
            .order_by(Post.created_at.desc(), Post.id.desc())
        ).all()
        history = [
            {
                "post_id": post.id,
                "event_title": post.event_title,
                "date": post.date,
                "capture_id": post.capture_id,
                "awarded_at": _coerce_utc_datetime(post.created_at).isoformat(),
            }
            for post in reward_posts
        ]
        return {
            "crown_count": len(reward_posts),
            "history": history,
        }


def _get_user(session: Session, user_id: str) -> User:
    user = session.get(User, user_id)
    if user is None or not user.is_active:
        raise KeyError(user_id)
    return user


def _get_post(session: Session, post_id: str) -> Post:
    statement = (
        select(Post)
        .execution_options(populate_existing=True)
        .options(
            selectinload(Post.user),
            selectinload(Post.likes).selectinload(PostLike.user),
            selectinload(Post.comments).selectinload(PostComment.user),
        )
        .where(Post.id == post_id)
    )
    post = session.scalars(statement).first()
    if post is None:
        raise KeyError(post_id)
    return post


def bootstrap_default_users() -> None:
    if not settings.bootstrap_users_enabled:
        return

    for user_config in (
        {
            "email": settings.bootstrap_admin_email,
            "password": settings.bootstrap_admin_password,
            "username": settings.bootstrap_admin_username,
            "full_name": settings.bootstrap_admin_full_name,
            "city": settings.bootstrap_admin_city,
            "bio": settings.bootstrap_admin_bio,
            "avatar_uri": settings.bootstrap_admin_avatar_uri,
            "role": "admin",
        },
        {
            "email": settings.bootstrap_demo_email,
            "password": settings.bootstrap_demo_password,
            "username": settings.bootstrap_demo_username,
            "full_name": settings.bootstrap_demo_full_name,
            "city": settings.bootstrap_demo_city,
            "bio": settings.bootstrap_demo_bio,
            "avatar_uri": settings.bootstrap_demo_avatar_uri,
            "role": "user",
        },
    ):
        try:
            with session_scope() as session:
                _ensure_bootstrap_user(session, **user_config)
        except IntegrityError:
            logger.warning(
                "Skipping bootstrap user for %s because a unique constraint already exists.",
                user_config["email"],
                exc_info=True,
            )


def _ensure_bootstrap_user(
    session: Session,
    *,
    email: str,
    password: str,
    username: str,
    full_name: str,
    city: str,
    bio: str,
    avatar_uri: str,
    role: str,
) -> None:
    normalized_email = _normalize_email(email)
    normalized_username = username.strip()
    user = session.scalars(select(User).where(User.email == normalized_email)).first()
    if user is None:
        username_owner = session.scalars(select(User).where(User.username == normalized_username)).first()
        if username_owner is not None:
            logger.warning(
                "Skipping bootstrap user for %s because username %s is already owned by %s.",
                normalized_email,
                normalized_username,
                username_owner.email,
            )
            return
        user = User(
            email=normalized_email,
            username=normalized_username,
            full_name=full_name.strip(),
            city=city.strip(),
            bio=bio.strip(),
            avatar_uri=_sanitize_avatar_uri(avatar_uri),
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )
        session.add(user)
        return

    changed = False
    for field_name, value in {
        "username": username.strip(),
        "full_name": full_name.strip(),
        "city": city.strip(),
        "bio": bio.strip(),
        "avatar_uri": _sanitize_avatar_uri(avatar_uri),
        "role": role,
        "is_active": True,
    }.items():
        if getattr(user, field_name) != value:
            setattr(user, field_name, value)
            changed = True

    if not verify_password(password, user.password_hash):
        user.password_hash = hash_password(password)
        changed = True

    if changed:
        user.updated_at = _utc_now()


def authenticate_user(email: str, password: str) -> dict[str, object] | None:
    with session_scope() as session:
        user = session.scalars(select(User).where(User.email == _normalize_email(email))).first()
        if user is None or not user.is_active:
            return None
        if not verify_password(password, user.password_hash):
            return None
        if password_hash_needs_upgrade(user.password_hash):
            user.password_hash = hash_password(password)
            user.updated_at = _utc_now()
            session.flush()
        return _serialize_user(user)


def get_user_by_id(user_id: str) -> dict[str, object] | None:
    with session_scope() as session:
        user = session.get(User, user_id)
        if user is None or not user.is_active:
            return None
        return _serialize_user(user)


def get_public_user_profile(user_id: str) -> dict[str, object] | None:
    with session_scope() as session:
        user = session.get(User, user_id)
        if user is None or not user.is_active:
            return None
        return _serialize_public_user_profile(user)


def get_user_by_email(email: str) -> dict[str, object] | None:
    with session_scope() as session:
        user = session.scalars(select(User).where(User.email == _normalize_email(email))).first()
        if user is None or not user.is_active:
            return None
        return _serialize_user(user)


def create_user(
    *,
    email: str,
    password: str,
    username: str,
    full_name: str,
    city: str,
    bio: str,
    avatar_uri: str,
    role: str = "user",
) -> dict[str, object]:
    normalized_email = _normalize_email(email)
    normalized_username = username.strip()

    with session_scope() as session:
        existing_email = session.scalars(select(User).where(User.email == normalized_email)).first()
        if existing_email is not None:
            raise ValueError("An account with that email already exists.")

        existing_username = session.scalars(select(User).where(User.username == normalized_username)).first()
        if existing_username is not None:
            raise ValueError("That username is already taken.")

        user = User(
            email=normalized_email,
            username=normalized_username,
            full_name=full_name.strip(),
            city=city.strip(),
            bio=bio.strip(),
            avatar_uri=_sanitize_avatar_uri(avatar_uri),
            password_hash=hash_password(password),
            role=role,
            is_active=True,
        )
        session.add(user)
        session.flush()
        return _serialize_user(user)


def update_user_profile(
    user_id: str,
    *,
    email: str | None = None,
    username: str | None = None,
    full_name: str | None = None,
    city: str | None = None,
    bio: str | None = None,
    avatar_uri: str | None = None,
) -> dict[str, object]:
    with session_scope() as session:
        user = _get_user(session, user_id)

        if email:
            normalized_email = _normalize_email(email)
            existing_email = session.scalars(
                select(User).where(User.email == normalized_email, User.id != user_id)
            ).first()
            if existing_email is not None:
                raise ValueError("An account with that email already exists.")
            user.email = normalized_email

        if username:
            trimmed_username = username.strip()
            existing_username = session.scalars(
                select(User).where(User.username == trimmed_username, User.id != user_id)
            ).first()
            if existing_username is not None:
                raise ValueError("That username is already taken.")
            user.username = trimmed_username

        if full_name is not None:
            user.full_name = full_name.strip()
        if city is not None:
            user.city = city.strip()
        if bio is not None:
            user.bio = bio.strip()
        if avatar_uri is not None:
            user.avatar_uri = _sanitize_avatar_uri(avatar_uri)

        user.updated_at = _utc_now()
        session.flush()
        return _serialize_user(user)


def change_user_password(user_id: str, current_password: str, new_password: str) -> None:
    with session_scope() as session:
        user = _get_user(session, user_id)
        if not verify_password(current_password, user.password_hash):
            raise ValueError("Current password is incorrect.")

        user.password_hash = hash_password(new_password)
        user.updated_at = _utc_now()


def delete_user(user_id: str) -> bool:
    with session_scope() as session:
        user = session.get(User, user_id)
        if user is None:
            return False
        session.delete(user)
        return True


def create_password_reset_request(email: str) -> PasswordResetRequestResult:
    normalized_email = _normalize_email(email)

    with session_scope() as session:
        user = session.scalars(select(User).where(User.email == normalized_email)).first()
        if user is None or not user.is_active:
            return PasswordResetRequestResult(challenge_id=None, code=None, debug_code=None)

        code = generate_reset_code()
        challenge = PasswordResetChallenge(
            user_id=user.id,
            code_hash=hash_password(code.strip().upper()),
            expires_at=_utc_now() + timedelta(minutes=settings.password_reset_code_minutes),
        )
        session.add(challenge)
        session.flush()

        debug_code = code if not settings.is_production else None
        return PasswordResetRequestResult(challenge_id=challenge.id, code=code, debug_code=debug_code)


def confirm_password_reset(challenge_id: str, code: str, new_password: str) -> None:
    with session_scope() as session:
        challenge = session.get(PasswordResetChallenge, challenge_id)
        if challenge is None or challenge.used_at is not None:
            raise ValueError("That reset request is no longer valid.")
        if _coerce_utc_datetime(challenge.expires_at) < _utc_now():
            raise ValueError("That reset code has expired.")
        if not verify_password(code.strip().upper(), challenge.code_hash):
            raise ValueError("Reset code is incorrect.")

        user = _get_user(session, challenge.user_id)
        user.password_hash = hash_password(new_password)
        user.updated_at = _utc_now()
        challenge.used_at = _utc_now()


def list_events() -> list[dict[str, object]]:
    with session_scope() as session:
        events = session.scalars(
            select(Event).order_by(Event.created_at.desc(), Event.title.asc())
        ).all()
        return [_serialize_event(event) for event in events]


def upsert_event(event: dict[str, object]) -> dict[str, object]:
    with session_scope() as session:
        record = session.get(Event, str(event["id"]))
        if record is None:
            record = Event(id=str(event["id"]))
            session.add(record)

        record.title = str(event["title"])
        record.short_title = event.get("short_title")
        record.date = str(event["date"])
        record.full_date = str(event["full_date"])
        record.time = str(event["time"])
        record.place = str(event["place"])
        record.address = str(event["address"])
        record.attendees = str(event["attendees"])
        record.attendee_count = int(event["attendee_count"])
        record.price = str(event["price"])
        record.price_label = str(event["price_label"])
        record.vibe = str(event["vibe"])
        record.experience = str(event["experience"])
        record.hero_image = str(event["hero_image"])
        record.host_name = str(event["host_name"])
        record.host_avatar = str(event["host_avatar"])
        record.badge = str(event["badge"])
        record.description = str(event["description"])
        record.tags_json = list(event.get("tags", []))
        record.updated_at = _utc_now()
        session.flush()
        return _serialize_event(record)


def delete_event(event_id: str) -> bool:
    with session_scope() as session:
        event = session.get(Event, event_id)
        if event is None:
            return False
        session.delete(event)
        return True


def list_posts() -> list[dict[str, object]]:
    with session_scope() as session:
        posts = session.scalars(
            select(Post)
            .options(
                selectinload(Post.user),
                selectinload(Post.likes).selectinload(PostLike.user),
                selectinload(Post.comments).selectinload(PostComment.user),
            )
            .order_by(Post.created_at.desc(), Post.id.desc())
        ).all()
        return [_serialize_post(post) for post in posts]


def upsert_post(post: dict[str, object], acting_user_id: str) -> dict[str, object]:
    with session_scope() as session:
        user = _get_user(session, acting_user_id)
        post_id = str(post.get("id") or "").strip() or _new_prefixed_id("post")
        record = _get_post_optional(session, post_id)

        if record is None:
            record = Post(id=post_id, user_id=user.id)
            session.add(record)
        elif record.user_id != user.id and user.role != "admin":
            raise PermissionError("You do not have permission to edit this post.")

        record.user_id = user.id
        record.image_uri = str(post["image_uri"])
        record.date = str(post["date"])
        record.is_beer_finished = bool(post["is_beer_finished"])
        record.event_id = post.get("event_id")
        record.event_title = post.get("event_title")
        record.capture_id = post.get("capture_id")
        record.updated_at = _utc_now()
        session.flush()

        if record.capture_id:
            capture = session.get(Capture, record.capture_id)
            if capture is not None:
                capture.user_id = user.id
                capture.username = user.username
                capture.event_id = record.event_id
                capture.event_title = record.event_title

        session.flush()
        post_record = _get_post(session, record.id)
        return _serialize_post(post_record)


def _get_post_optional(session: Session, post_id: str) -> Post | None:
    return session.scalars(
        select(Post)
        .execution_options(populate_existing=True)
        .options(
            selectinload(Post.user),
            selectinload(Post.likes).selectinload(PostLike.user),
            selectinload(Post.comments).selectinload(PostComment.user),
        )
        .where(Post.id == post_id)
    ).first()


def toggle_post_like(post_id: str, acting_user_id: str) -> dict[str, object]:
    with session_scope() as session:
        acting_user = _get_user(session, acting_user_id)
        post = _get_post(session, post_id)
        existing_like = session.scalars(
            select(PostLike).where(PostLike.post_id == post.id, PostLike.user_id == acting_user_id)
        ).first()

        if existing_like is None:
            session.add(PostLike(post_id=post.id, user_id=acting_user_id))
            if post.user_id != acting_user_id:
                _create_notification(
                    session,
                    user_id=post.user_id,
                    actor_user_id=acting_user.id,
                    title="New like",
                    message=f"{acting_user.username} liked your post.",
                    icon="heart",
                    color="#ef4444",
                    related_type="post",
                    related_id=post.id,
                )
        else:
            session.delete(existing_like)

        session.flush()
        post = _get_post(session, post.id)
        return _serialize_post(post)


def add_post_comment(post_id: str, acting_user_id: str, text: str, time_label: str) -> dict[str, object]:
    with session_scope() as session:
        _get_user(session, acting_user_id)
        post = _get_post(session, post_id)
        comment = PostComment(
            id=_new_prefixed_id("comment"),
            post_id=post.id,
            user_id=acting_user_id,
            text=text,
            time_label=time_label,
        )
        session.add(comment)
        session.flush()
        post = _get_post(session, post.id)
        return _serialize_post(post)


def delete_post(post_id: str, acting_user_id: str) -> bool:
    with session_scope() as session:
        user = _get_user(session, acting_user_id)
        post = session.get(Post, post_id)
        if post is None:
            return False
        if post.user_id != user.id and user.role != "admin":
            raise PermissionError("You do not have permission to delete this post.")
        session.delete(post)
        return True


def create_capture(
    *,
    user_id: str | None,
    username: str | None,
    event_id: str | None,
    event_title: str | None,
    original_media_path: str,
    annotated_media_path: str,
    source: str,
    summary: dict[str, object],
    detections: list[dict[str, object]],
) -> dict[str, object]:
    capture_id = _new_prefixed_id("capture")

    with session_scope() as session:
        capture = Capture(
            id=capture_id,
            user_id=user_id,
            username=username,
            event_id=event_id,
            event_title=event_title,
            original_media_path=original_media_path,
            annotated_media_path=annotated_media_path,
            status_label=str(summary["status_label"]),
            headline=str(summary["headline"]),
            message=str(summary["message"]),
            has_detections=bool(summary["has_detections"]),
            has_drinking_action=bool(summary["has_drinking_action"]),
            contains_beer=bool(summary["contains_beer"]),
            crown_eligible=bool(summary["crown_eligible"]),
            drink_count=int(summary["drink_count"]),
            drink_types_json=list(summary.get("drink_types", [])),
            top_drink=summary.get("top_drink"),
            top_confidence=summary.get("top_confidence"),
            source=source,
        )
        session.add(capture)
        session.flush()

        for item in detections:
            session.add(
                CaptureDetection(
                    capture_id=capture.id,
                    label=str(item["label"]),
                    drink_type=str(item["drink_type"]),
                    confidence=float(item["confidence"]),
                    bbox_json=list(item.get("bbox", [])),
                    is_drinking=bool(item["is_drinking"]),
                )
            )

        session.flush()
        return _serialize_capture(capture)


def list_captures(limit: int = 25) -> list[dict[str, object]]:
    safe_limit = max(1, min(limit, 100))
    with session_scope() as session:
        captures = session.scalars(
            select(Capture).order_by(Capture.created_at.desc(), Capture.id.desc()).limit(safe_limit)
        ).all()
        return [_serialize_capture(capture) for capture in captures]
