"""Database models and persistence helpers."""

from __future__ import annotations

import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload, sessionmaker

try:
    from .config import settings
    from .security import generate_reset_code, hash_password, verify_password
except ImportError:
    from config import settings
    from security import generate_reset_code, hash_password, verify_password


def _utc_now() -> datetime:
    return datetime.now(UTC)


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
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    bootstrap_default_users()


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


def _get_user(session: Session, user_id: str) -> User:
    user = session.get(User, user_id)
    if user is None or not user.is_active:
        raise KeyError(user_id)
    return user


def _get_post(session: Session, post_id: str) -> Post:
    statement = (
        select(Post)
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

    with session_scope() as session:
        _ensure_bootstrap_user(
            session,
            email=settings.bootstrap_admin_email,
            password=settings.bootstrap_admin_password,
            username=settings.bootstrap_admin_username,
            full_name=settings.bootstrap_admin_full_name,
            city=settings.bootstrap_admin_city,
            bio=settings.bootstrap_admin_bio,
            avatar_uri=settings.bootstrap_admin_avatar_uri,
            role="admin",
        )
        _ensure_bootstrap_user(
            session,
            email=settings.bootstrap_demo_email,
            password=settings.bootstrap_demo_password,
            username=settings.bootstrap_demo_username,
            full_name=settings.bootstrap_demo_full_name,
            city=settings.bootstrap_demo_city,
            bio=settings.bootstrap_demo_bio,
            avatar_uri=settings.bootstrap_demo_avatar_uri,
            role="user",
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
    user = session.scalars(select(User).where(User.email == normalized_email)).first()
    if user is None:
        user = User(
            email=normalized_email,
            username=username.strip(),
            full_name=full_name.strip(),
            city=city.strip(),
            bio=bio.strip(),
            avatar_uri=avatar_uri.strip(),
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
        "avatar_uri": avatar_uri.strip(),
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
        return _serialize_user(user)


def get_user_by_id(user_id: str) -> dict[str, object] | None:
    with session_scope() as session:
        user = session.get(User, user_id)
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
) -> dict[str, object]:
    normalized_email = _normalize_email(email)

    with session_scope() as session:
        existing_email = session.scalars(select(User).where(User.email == normalized_email)).first()
        if existing_email is not None:
            raise ValueError("An account with that email already exists.")

        existing_username = session.scalars(select(User).where(User.username == username.strip())).first()
        if existing_username is not None:
            raise ValueError("That username is already taken.")

        user = User(
            email=normalized_email,
            username=username.strip(),
            full_name=full_name.strip(),
            city=city.strip(),
            bio=bio.strip(),
            avatar_uri=avatar_uri.strip(),
            password_hash=hash_password(password),
            role="user",
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
            user.avatar_uri = avatar_uri.strip()

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
        if challenge.expires_at < _utc_now():
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
        post_id = str(post["id"]).strip() or _new_prefixed_id("post")
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
        .options(
            selectinload(Post.user),
            selectinload(Post.likes).selectinload(PostLike.user),
            selectinload(Post.comments).selectinload(PostComment.user),
        )
        .where(Post.id == post_id)
    ).first()


def toggle_post_like(post_id: str, acting_user_id: str) -> dict[str, object]:
    with session_scope() as session:
        _get_user(session, acting_user_id)
        post = _get_post(session, post_id)
        existing_like = session.scalars(
            select(PostLike).where(PostLike.post_id == post.id, PostLike.user_id == acting_user_id)
        ).first()

        if existing_like is None:
            session.add(PostLike(post_id=post.id, user_id=acting_user_id))
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
