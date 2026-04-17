"""SQLite persistence helpers for the EventCapture backend."""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

try:
    from .config import DATABASE_PATH
except ImportError:
    from config import DATABASE_PATH


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def _json_dump(value: object) -> str:
    return json.dumps(value, ensure_ascii=True, separators=(",", ":"))


def _json_load_list(value: str | None) -> list:
    if not value:
        return []

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []

    return parsed if isinstance(parsed, list) else []


def _get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_database() -> None:
    with closing(_get_connection()) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                short_title TEXT,
                date TEXT NOT NULL,
                full_date TEXT NOT NULL,
                time TEXT NOT NULL,
                place TEXT NOT NULL,
                address TEXT NOT NULL,
                attendees TEXT NOT NULL,
                attendee_count INTEGER NOT NULL DEFAULT 0,
                price TEXT NOT NULL,
                price_label TEXT NOT NULL,
                vibe TEXT NOT NULL,
                experience TEXT NOT NULL,
                hero_image TEXT NOT NULL,
                host_name TEXT NOT NULL,
                host_avatar TEXT NOT NULL,
                badge TEXT NOT NULL,
                description TEXT NOT NULL,
                tags_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                avatar_uri TEXT NOT NULL,
                image_uri TEXT NOT NULL,
                date TEXT NOT NULL,
                is_beer_finished INTEGER NOT NULL DEFAULT 0,
                event_id TEXT,
                event_title TEXT,
                capture_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS post_likes (
                post_id TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (post_id, username),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS post_comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                avatar_uri TEXT NOT NULL,
                text TEXT NOT NULL,
                time_label TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS captures (
                id TEXT PRIMARY KEY,
                username TEXT,
                event_id TEXT,
                event_title TEXT,
                original_media_path TEXT NOT NULL,
                annotated_media_path TEXT NOT NULL,
                status_label TEXT NOT NULL,
                headline TEXT NOT NULL,
                message TEXT NOT NULL,
                has_detections INTEGER NOT NULL,
                has_drinking_action INTEGER NOT NULL,
                contains_beer INTEGER NOT NULL,
                crown_eligible INTEGER NOT NULL,
                drink_count INTEGER NOT NULL,
                drink_types_json TEXT NOT NULL DEFAULT '[]',
                top_drink TEXT,
                top_confidence REAL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS capture_detections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                capture_id TEXT NOT NULL,
                label TEXT NOT NULL,
                drink_type TEXT NOT NULL,
                confidence REAL NOT NULL,
                bbox_json TEXT NOT NULL,
                is_drinking INTEGER NOT NULL,
                FOREIGN KEY (capture_id) REFERENCES captures(id) ON DELETE CASCADE
            );
            """
        )
        connection.commit()


def _event_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "title": row["title"],
        "short_title": row["short_title"],
        "date": row["date"],
        "full_date": row["full_date"],
        "time": row["time"],
        "place": row["place"],
        "address": row["address"],
        "attendees": row["attendees"],
        "attendee_count": row["attendee_count"],
        "price": row["price"],
        "price_label": row["price_label"],
        "vibe": row["vibe"],
        "experience": row["experience"],
        "hero_image": row["hero_image"],
        "host_name": row["host_name"],
        "host_avatar": row["host_avatar"],
        "badge": row["badge"],
        "description": row["description"],
        "tags": _json_load_list(row["tags_json"]),
    }


def list_events() -> list[dict[str, object]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            "SELECT * FROM events ORDER BY created_at DESC, title COLLATE NOCASE ASC"
        ).fetchall()
        return [_event_from_row(row) for row in rows]


def upsert_event(event: dict[str, object]) -> dict[str, object]:
    now = _utc_now()
    payload = {
        "id": str(event["id"]),
        "title": str(event["title"]),
        "short_title": event.get("short_title"),
        "date": str(event["date"]),
        "full_date": str(event["full_date"]),
        "time": str(event["time"]),
        "place": str(event["place"]),
        "address": str(event["address"]),
        "attendees": str(event["attendees"]),
        "attendee_count": int(event["attendee_count"]),
        "price": str(event["price"]),
        "price_label": str(event["price_label"]),
        "vibe": str(event["vibe"]),
        "experience": str(event["experience"]),
        "hero_image": str(event["hero_image"]),
        "host_name": str(event["host_name"]),
        "host_avatar": str(event["host_avatar"]),
        "badge": str(event["badge"]),
        "description": str(event["description"]),
        "tags_json": _json_dump(event.get("tags", [])),
        "created_at": now,
        "updated_at": now,
    }

    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO events (
                id, title, short_title, date, full_date, time, place, address,
                attendees, attendee_count, price, price_label, vibe, experience,
                hero_image, host_name, host_avatar, badge, description, tags_json,
                created_at, updated_at
            )
            VALUES (
                :id, :title, :short_title, :date, :full_date, :time, :place, :address,
                :attendees, :attendee_count, :price, :price_label, :vibe, :experience,
                :hero_image, :host_name, :host_avatar, :badge, :description, :tags_json,
                :created_at, :updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                short_title = excluded.short_title,
                date = excluded.date,
                full_date = excluded.full_date,
                time = excluded.time,
                place = excluded.place,
                address = excluded.address,
                attendees = excluded.attendees,
                attendee_count = excluded.attendee_count,
                price = excluded.price,
                price_label = excluded.price_label,
                vibe = excluded.vibe,
                experience = excluded.experience,
                hero_image = excluded.hero_image,
                host_name = excluded.host_name,
                host_avatar = excluded.host_avatar,
                badge = excluded.badge,
                description = excluded.description,
                tags_json = excluded.tags_json,
                updated_at = excluded.updated_at
            """,
            payload,
        )
        connection.commit()
        row = connection.execute("SELECT * FROM events WHERE id = ?", (payload["id"],)).fetchone()

    if row is None:
        raise RuntimeError("Failed to load event after upsert.")

    return _event_from_row(row)


def _comment_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "user": {
            "id": row["user_id"],
            "username": row["username"],
            "avatar_uri": row["avatar_uri"],
        },
        "text": row["text"],
        "time": row["time_label"],
    }


def _load_post_likes(connection: sqlite3.Connection, post_id: str) -> list[str]:
    rows = connection.execute(
        "SELECT username FROM post_likes WHERE post_id = ? ORDER BY created_at ASC",
        (post_id,),
    ).fetchall()
    return [str(row["username"]) for row in rows]


def _load_post_comments(connection: sqlite3.Connection, post_id: str) -> list[dict[str, object]]:
    rows = connection.execute(
        "SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at DESC",
        (post_id,),
    ).fetchall()
    return [_comment_from_row(row) for row in rows]


def _post_from_row(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "user": {
            "id": row["user_id"],
            "username": row["username"],
            "avatar_uri": row["avatar_uri"],
        },
        "image_uri": row["image_uri"],
        "date": row["date"],
        "is_beer_finished": bool(row["is_beer_finished"]),
        "event_id": row["event_id"],
        "event_title": row["event_title"],
        "likes": _load_post_likes(connection, str(row["id"])),
        "comments": _load_post_comments(connection, str(row["id"])),
        "capture_id": row["capture_id"],
    }


def list_posts() -> list[dict[str, object]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            "SELECT * FROM posts ORDER BY created_at DESC, id DESC"
        ).fetchall()
        return [_post_from_row(connection, row) for row in rows]


def _load_post_by_id(connection: sqlite3.Connection, post_id: str) -> dict[str, object] | None:
    row = connection.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    if row is None:
        return None
    return _post_from_row(connection, row)


def upsert_post(post: dict[str, object]) -> dict[str, object]:
    now = _utc_now()
    user = post["user"]
    if not isinstance(user, dict):
        raise ValueError("Post user payload is invalid.")

    payload = {
        "id": str(post["id"]),
        "user_id": str(user["id"]),
        "username": str(user["username"]),
        "avatar_uri": str(user["avatar_uri"]),
        "image_uri": str(post["image_uri"]),
        "date": str(post["date"]),
        "is_beer_finished": 1 if bool(post["is_beer_finished"]) else 0,
        "event_id": post.get("event_id"),
        "event_title": post.get("event_title"),
        "capture_id": post.get("capture_id"),
        "created_at": now,
        "updated_at": now,
    }

    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO posts (
                id, user_id, username, avatar_uri, image_uri, date,
                is_beer_finished, event_id, event_title, capture_id,
                created_at, updated_at
            )
            VALUES (
                :id, :user_id, :username, :avatar_uri, :image_uri, :date,
                :is_beer_finished, :event_id, :event_title, :capture_id,
                :created_at, :updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
                user_id = excluded.user_id,
                username = excluded.username,
                avatar_uri = excluded.avatar_uri,
                image_uri = excluded.image_uri,
                date = excluded.date,
                is_beer_finished = excluded.is_beer_finished,
                event_id = excluded.event_id,
                event_title = excluded.event_title,
                capture_id = excluded.capture_id,
                updated_at = excluded.updated_at
            """,
            payload,
        )

        if payload["capture_id"]:
            connection.execute(
                """
                UPDATE captures
                SET
                    username = COALESCE(?, username),
                    event_id = COALESCE(?, event_id),
                    event_title = COALESCE(?, event_title)
                WHERE id = ?
                """,
                (
                    payload["username"],
                    payload["event_id"],
                    payload["event_title"],
                    payload["capture_id"],
                ),
            )

        connection.commit()
        persisted = _load_post_by_id(connection, payload["id"])

    if persisted is None:
        raise RuntimeError("Failed to load post after upsert.")

    return persisted


def toggle_post_like(post_id: str, username: str) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        post_exists = connection.execute(
            "SELECT 1 FROM posts WHERE id = ?",
            (post_id,),
        ).fetchone()
        if post_exists is None:
            raise KeyError(post_id)

        existing = connection.execute(
            "SELECT 1 FROM post_likes WHERE post_id = ? AND username = ?",
            (post_id, username),
        ).fetchone()

        if existing is None:
            connection.execute(
                "INSERT INTO post_likes (post_id, username, created_at) VALUES (?, ?, ?)",
                (post_id, username, _utc_now()),
            )
        else:
            connection.execute(
                "DELETE FROM post_likes WHERE post_id = ? AND username = ?",
                (post_id, username),
            )

        connection.commit()
        persisted = _load_post_by_id(connection, post_id)

    if persisted is None:
        raise KeyError(post_id)

    return persisted


def add_post_comment(post_id: str, user: dict[str, object], text: str, time_label: str) -> dict[str, object]:
    comment_id = _new_id("comment")
    created_at = _utc_now()

    with closing(_get_connection()) as connection:
        post_exists = connection.execute(
            "SELECT 1 FROM posts WHERE id = ?",
            (post_id,),
        ).fetchone()
        if post_exists is None:
            raise KeyError(post_id)

        connection.execute(
            """
            INSERT INTO post_comments (
                id, post_id, user_id, username, avatar_uri, text, time_label, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                comment_id,
                post_id,
                str(user["id"]),
                str(user["username"]),
                str(user["avatar_uri"]),
                text,
                time_label,
                created_at,
            ),
        )
        connection.commit()
        persisted = _load_post_by_id(connection, post_id)

    if persisted is None:
        raise KeyError(post_id)

    return persisted


def delete_post(post_id: str) -> bool:
    with closing(_get_connection()) as connection:
        cursor = connection.execute("DELETE FROM posts WHERE id = ?", (post_id,))
        connection.commit()
        return cursor.rowcount > 0


def _capture_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "username": row["username"],
        "event_id": row["event_id"],
        "event_title": row["event_title"],
        "original_media_path": row["original_media_path"],
        "annotated_media_path": row["annotated_media_path"],
        "status_label": row["status_label"],
        "headline": row["headline"],
        "message": row["message"],
        "has_detections": bool(row["has_detections"]),
        "has_drinking_action": bool(row["has_drinking_action"]),
        "contains_beer": bool(row["contains_beer"]),
        "crown_eligible": bool(row["crown_eligible"]),
        "drink_count": row["drink_count"],
        "drink_types": _json_load_list(row["drink_types_json"]),
        "top_drink": row["top_drink"],
        "top_confidence": row["top_confidence"],
        "source": row["source"],
        "created_at": row["created_at"],
    }


def create_capture(
    *,
    username: str | None,
    event_id: str | None,
    event_title: str | None,
    original_media_path: str,
    annotated_media_path: str,
    source: str,
    summary: dict[str, object],
    detections: list[dict[str, object]],
) -> dict[str, object]:
    capture_id = _new_id("capture")
    created_at = _utc_now()

    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO captures (
                id, username, event_id, event_title, original_media_path, annotated_media_path,
                status_label, headline, message, has_detections, has_drinking_action,
                contains_beer, crown_eligible, drink_count, drink_types_json, top_drink,
                top_confidence, source, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                capture_id,
                username,
                event_id,
                event_title,
                original_media_path,
                annotated_media_path,
                str(summary["status_label"]),
                str(summary["headline"]),
                str(summary["message"]),
                1 if bool(summary["has_detections"]) else 0,
                1 if bool(summary["has_drinking_action"]) else 0,
                1 if bool(summary["contains_beer"]) else 0,
                1 if bool(summary["crown_eligible"]) else 0,
                int(summary["drink_count"]),
                _json_dump(summary.get("drink_types", [])),
                summary.get("top_drink"),
                summary.get("top_confidence"),
                source,
                created_at,
            ),
        )

        connection.executemany(
            """
            INSERT INTO capture_detections (
                capture_id, label, drink_type, confidence, bbox_json, is_drinking
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    capture_id,
                    str(item["label"]),
                    str(item["drink_type"]),
                    float(item["confidence"]),
                    _json_dump(item.get("bbox", [])),
                    1 if bool(item["is_drinking"]) else 0,
                )
                for item in detections
            ],
        )

        connection.commit()
        row = connection.execute("SELECT * FROM captures WHERE id = ?", (capture_id,)).fetchone()

    if row is None:
        raise RuntimeError("Failed to load capture after insert.")

    return _capture_from_row(row)


def list_captures(limit: int = 25) -> list[dict[str, object]]:
    safe_limit = max(1, min(limit, 100))
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            "SELECT * FROM captures ORDER BY created_at DESC, id DESC LIMIT ?",
            (safe_limit,),
        ).fetchall()
        return [_capture_from_row(row) for row in rows]
