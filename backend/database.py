"""SQLite persistence helpers for the EventCapture backend."""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import closing
from datetime import datetime, timedelta, timezone

try:
    from .config import DATABASE_PATH
    from .security import generate_session_token, hash_password, hash_session_token, verify_password
except ImportError:
    from config import DATABASE_PATH
    from security import generate_session_token, hash_password, hash_session_token, verify_password


EVENT_PLAN_STATUSES = {"going", "maybe", "skip"}
_UNSET = object()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _future_utc(hours: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat(timespec="seconds")


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


def _table_columns(connection: sqlite3.Connection, table_name: str) -> set[str]:
    rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {str(row["name"]) for row in rows}


def _ensure_column(connection: sqlite3.Connection, table_name: str, column_name: str, definition: str) -> None:
    if column_name not in _table_columns(connection, table_name):
        connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


def init_database() -> None:
    with closing(_get_connection()) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                bio TEXT NOT NULL DEFAULT '',
                city TEXT NOT NULL,
                avatar_uri TEXT NOT NULL DEFAULT '',
                role TEXT NOT NULL DEFAULT 'user',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

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
                created_by_user_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS event_reactions (
                event_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                liked INTEGER NOT NULL DEFAULT 0,
                saved INTEGER NOT NULL DEFAULT 0,
                plan_status TEXT,
                plan_note TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL,
                PRIMARY KEY (event_id, user_id),
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS event_comments (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                avatar_uri TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS post_likes (
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (post_id, user_id),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

        _ensure_column(connection, "events", "created_by_user_id", "TEXT")
        _ensure_column(connection, "post_likes", "user_id", "TEXT")
        connection.commit()


def database_exists() -> bool:
    return DATABASE_PATH.exists()


def _user_summary_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "username": row["username"],
        "avatar_uri": row["avatar_uri"],
    }


def _user_profile_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "username": row["username"],
        "full_name": row["full_name"],
        "bio": row["bio"],
        "city": row["city"],
        "email": row["email"],
        "avatar_uri": row["avatar_uri"],
        "role": row["role"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_user_by_email(email: str) -> dict[str, object] | None:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ? AND is_active = 1",
            (email.strip().lower(),),
        ).fetchone()
        return _user_profile_from_row(row) if row is not None else None


def get_user_by_id(user_id: str) -> dict[str, object] | None:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE id = ? AND is_active = 1",
            (user_id,),
        ).fetchone()
        return _user_profile_from_row(row) if row is not None else None


def create_user(*, email: str, username: str, password: str, full_name: str, city: str, bio: str, avatar_uri: str, role: str = "user") -> dict[str, object]:
    user_id = _new_id("user")
    now = _utc_now()
    payload = (
        user_id,
        email.strip().lower(),
        username.strip(),
        hash_password(password),
        full_name.strip(),
        bio.strip(),
        city.strip(),
        avatar_uri.strip(),
        role,
        1,
        now,
        now,
    )

    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO users (
                id, email, username, password_hash, full_name, bio, city, avatar_uri,
                role, is_active, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            payload,
        )
        connection.commit()
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if row is None:
        raise RuntimeError("Failed to load created user.")
    return _user_profile_from_row(row)


def authenticate_user(email: str, password: str) -> dict[str, object] | None:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ? AND is_active = 1",
            (email.strip().lower(),),
        ).fetchone()
        if row is None:
            return None
        if not verify_password(password, str(row["password_hash"])):
            return None
        return _user_profile_from_row(row)


def create_session(user_id: str, ttl_hours: int) -> dict[str, str]:
    session_id = _new_id("session")
    token = generate_session_token()
    token_hash = hash_session_token(token)
    now = _utc_now()
    expires_at = _future_utc(ttl_hours)

    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (session_id, user_id, token_hash, expires_at, now, now),
        )
        connection.commit()

    return {"token": token, "expires_at": expires_at}


def get_user_by_session_token(token: str) -> dict[str, object] | None:
    token_hash = hash_session_token(token)
    now = _utc_now()
    with closing(_get_connection()) as connection:
        row = connection.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ? AND users.is_active = 1
            """,
            (token_hash, now),
        ).fetchone()
        if row is None:
            return None
        connection.execute(
            "UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?",
            (now, token_hash),
        )
        connection.commit()
        return _user_profile_from_row(row)


def delete_session(token: str) -> None:
    with closing(_get_connection()) as connection:
        connection.execute(
            "DELETE FROM sessions WHERE token_hash = ?",
            (hash_session_token(token),),
        )
        connection.commit()


def update_user_profile(user_id: str, *, username: str, full_name: str, city: str, bio: str, avatar_uri: str, email: str) -> dict[str, object]:
    now = _utc_now()
    with closing(_get_connection()) as connection:
        connection.execute(
            """
            UPDATE users
            SET username = ?, full_name = ?, city = ?, bio = ?, avatar_uri = ?, email = ?, updated_at = ?
            WHERE id = ? AND is_active = 1
            """,
            (username.strip(), full_name.strip(), city.strip(), bio.strip(), avatar_uri.strip(), email.strip().lower(), now, user_id),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if row is None:
        raise KeyError(user_id)
    return _user_profile_from_row(row)


def change_user_password(user_id: str, current_password: str, new_password: str) -> bool:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT password_hash FROM users WHERE id = ? AND is_active = 1",
            (user_id,),
        ).fetchone()
        if row is None or not verify_password(current_password, str(row["password_hash"])):
            return False
        connection.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (hash_password(new_password), _utc_now(), user_id),
        )
        connection.commit()
        return True


def reset_user_password(email: str, new_password: str) -> bool:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT id FROM users WHERE email = ? AND is_active = 1",
            (email.strip().lower(),),
        ).fetchone()
        if row is None:
            return False
        connection.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (hash_password(new_password), _utc_now(), str(row["id"])),
        )
        connection.commit()
        return True


def list_users() -> list[dict[str, object]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            "SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC, username COLLATE NOCASE ASC"
        ).fetchall()
        return [_user_profile_from_row(row) for row in rows]


def deactivate_user(user_id: str) -> bool:
    with closing(_get_connection()) as connection:
        cursor = connection.execute(
            "UPDATE users SET is_active = 0, updated_at = ? WHERE id = ? AND role != 'admin'",
            (_utc_now(), user_id),
        )
        connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        connection.commit()
        return cursor.rowcount > 0


def _event_from_row(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, object]:
    attendee_count = int(
        connection.execute(
            "SELECT COUNT(*) FROM event_reactions WHERE event_id = ? AND plan_status = 'going'",
            (row["id"],),
        ).fetchone()[0]
    )
    return {
        "id": row["id"],
        "title": row["title"],
        "short_title": row["short_title"],
        "date": row["date"],
        "full_date": row["full_date"],
        "time": row["time"],
        "place": row["place"],
        "address": row["address"],
        "attendees": f"{attendee_count} going",
        "attendee_count": attendee_count,
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
        "created_by_user_id": row["created_by_user_id"],
    }


def list_events() -> list[dict[str, object]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            "SELECT * FROM events ORDER BY created_at DESC, title COLLATE NOCASE ASC"
        ).fetchall()
        return [_event_from_row(connection, row) for row in rows]


def upsert_event(event: dict[str, object], actor: dict[str, object]) -> dict[str, object]:
    event_id = str(event.get("id") or _new_id("event"))
    now = _utc_now()
    is_admin = str(actor["role"]) == "admin"

    with closing(_get_connection()) as connection:
        existing = connection.execute("SELECT created_by_user_id FROM events WHERE id = ?", (event_id,)).fetchone()
        created_by_user_id = str(actor["id"])
        created_at = now
        if existing is not None:
            owner_id = existing["created_by_user_id"]
            if owner_id and owner_id != actor["id"] and not is_admin:
                raise PermissionError("You cannot edit this event.")
            created_by_user_id = str(owner_id or actor["id"])
            created_at_row = connection.execute("SELECT created_at FROM events WHERE id = ?", (event_id,)).fetchone()
            created_at = str(created_at_row["created_at"]) if created_at_row is not None else now

        payload = {
            "id": event_id,
            "title": str(event["title"]).strip(),
            "short_title": event.get("short_title"),
            "date": str(event["date"]).strip(),
            "full_date": str(event["full_date"]).strip(),
            "time": str(event["time"]).strip(),
            "place": str(event["place"]).strip(),
            "address": str(event["address"]).strip(),
            "attendees": "0 going",
            "attendee_count": 0,
            "price": str(event["price"]).strip(),
            "price_label": str(event["price_label"]).strip(),
            "vibe": str(event["vibe"]).strip(),
            "experience": str(event["experience"]).strip(),
            "hero_image": str(event["hero_image"]).strip(),
            "host_name": str(actor["full_name"]).strip() or str(actor["username"]).strip(),
            "host_avatar": str(actor["avatar_uri"]).strip(),
            "badge": str(event["badge"]).strip(),
            "description": str(event["description"]).strip(),
            "tags_json": _json_dump(event.get("tags", [])),
            "created_by_user_id": created_by_user_id,
            "created_at": created_at,
            "updated_at": now,
        }

        connection.execute(
            """
            INSERT INTO events (
                id, title, short_title, date, full_date, time, place, address, attendees,
                attendee_count, price, price_label, vibe, experience, hero_image, host_name,
                host_avatar, badge, description, tags_json, created_by_user_id, created_at, updated_at
            )
            VALUES (
                :id, :title, :short_title, :date, :full_date, :time, :place, :address, :attendees,
                :attendee_count, :price, :price_label, :vibe, :experience, :hero_image, :host_name,
                :host_avatar, :badge, :description, :tags_json, :created_by_user_id, :created_at, :updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                short_title = excluded.short_title,
                date = excluded.date,
                full_date = excluded.full_date,
                time = excluded.time,
                place = excluded.place,
                address = excluded.address,
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
                created_by_user_id = excluded.created_by_user_id,
                updated_at = excluded.updated_at
            """,
            payload,
        )
        connection.commit()
        row = connection.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()

    if row is None:
        raise RuntimeError("Failed to load event after upsert.")
    with closing(_get_connection()) as connection:
        row = connection.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if row is None:
            raise RuntimeError("Failed to reload event after upsert.")
        return _event_from_row(connection, row)


def delete_event(event_id: str, actor: dict[str, object]) -> bool:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT created_by_user_id FROM events WHERE id = ?",
            (event_id,),
        ).fetchone()
        if row is None:
            return False
        if row["created_by_user_id"] not in {None, actor["id"]} and actor["role"] != "admin":
            raise PermissionError("You cannot delete this event.")
        cursor = connection.execute("DELETE FROM events WHERE id = ?", (event_id,))
        connection.commit()
        return cursor.rowcount > 0


def _event_comment_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "user": {
            "id": row["user_id"],
            "username": row["username"],
            "avatar_uri": row["avatar_uri"],
        },
        "text": row["text"],
        "time": row["created_at"],
    }


def _event_likes(connection: sqlite3.Connection, event_id: str) -> list[dict[str, object]]:
    rows = connection.execute(
        """
        SELECT users.id, users.username, users.avatar_uri
        FROM event_reactions
        JOIN users ON users.id = event_reactions.user_id
        WHERE event_reactions.event_id = ? AND event_reactions.liked = 1 AND users.is_active = 1
        ORDER BY users.username COLLATE NOCASE ASC
        """,
        (event_id,),
    ).fetchall()
    return [_user_summary_from_row(row) for row in rows]


def _event_comments(connection: sqlite3.Connection, event_id: str) -> list[dict[str, object]]:
    rows = connection.execute(
        "SELECT * FROM event_comments WHERE event_id = ? ORDER BY created_at DESC",
        (event_id,),
    ).fetchall()
    return [_event_comment_from_row(row) for row in rows]


def get_event_social_map(user_id: str) -> dict[str, dict[str, object]]:
    with closing(_get_connection()) as connection:
        events = connection.execute("SELECT id FROM events").fetchall()
        reaction_rows = connection.execute(
            "SELECT * FROM event_reactions WHERE user_id = ?",
            (user_id,),
        ).fetchall()
        reaction_map = {str(row["event_id"]): row for row in reaction_rows}
        result: dict[str, dict[str, object]] = {}
        for event_row in events:
            event_id = str(event_row["id"])
            reaction = reaction_map.get(event_id)
            result[event_id] = {
                "liked": bool(reaction["liked"]) if reaction is not None else False,
                "saved": bool(reaction["saved"]) if reaction is not None else False,
                "likes": _event_likes(connection, event_id),
                "comments": _event_comments(connection, event_id),
                "plan_status": str(reaction["plan_status"]) if reaction is not None and reaction["plan_status"] else None,
                "plan_note": str(reaction["plan_note"]) if reaction is not None and reaction["plan_note"] else "",
            }
        return result


def _upsert_event_reaction(connection: sqlite3.Connection, *, event_id: str, user_id: str, liked: int | None = None, saved: int | None = None, plan_status: str | None | object = _UNSET, plan_note: str | None = None) -> None:
    existing = connection.execute(
        "SELECT * FROM event_reactions WHERE event_id = ? AND user_id = ?",
        (event_id, user_id),
    ).fetchone()
    payload = {
        "liked": int(existing["liked"]) if existing is not None else 0,
        "saved": int(existing["saved"]) if existing is not None else 0,
        "plan_status": str(existing["plan_status"]) if existing is not None and existing["plan_status"] else None,
        "plan_note": str(existing["plan_note"]) if existing is not None else "",
    }
    if liked is not None:
        payload["liked"] = liked
    if saved is not None:
        payload["saved"] = saved
    if plan_status is not _UNSET:
        payload["plan_status"] = plan_status
    if plan_note is not None:
        payload["plan_note"] = plan_note
    connection.execute(
        """
        INSERT INTO event_reactions (event_id, user_id, liked, saved, plan_status, plan_note, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_id, user_id) DO UPDATE SET
            liked = excluded.liked,
            saved = excluded.saved,
            plan_status = excluded.plan_status,
            plan_note = excluded.plan_note,
            updated_at = excluded.updated_at
        """,
        (event_id, user_id, payload["liked"], payload["saved"], payload["plan_status"], payload["plan_note"], _utc_now()),
    )


def _event_social_state(connection: sqlite3.Connection, event_id: str, user_id: str) -> dict[str, object]:
    reaction = connection.execute(
        "SELECT * FROM event_reactions WHERE event_id = ? AND user_id = ?",
        (event_id, user_id),
    ).fetchone()
    return {
        "liked": bool(reaction["liked"]) if reaction is not None else False,
        "saved": bool(reaction["saved"]) if reaction is not None else False,
        "likes": _event_likes(connection, event_id),
        "comments": _event_comments(connection, event_id),
        "plan_status": str(reaction["plan_status"]) if reaction is not None and reaction["plan_status"] else None,
        "plan_note": str(reaction["plan_note"]) if reaction is not None and reaction["plan_note"] else "",
    }


def toggle_event_like(event_id: str, actor: dict[str, object]) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        event_exists = connection.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_exists is None:
            raise KeyError(event_id)
        current = connection.execute(
            "SELECT liked FROM event_reactions WHERE event_id = ? AND user_id = ?",
            (event_id, actor["id"]),
        ).fetchone()
        next_liked = 0 if current is not None and int(current["liked"]) == 1 else 1
        _upsert_event_reaction(connection, event_id=event_id, user_id=str(actor["id"]), liked=next_liked)
        connection.commit()
        return _event_social_state(connection, event_id, str(actor["id"]))


def toggle_event_save(event_id: str, actor: dict[str, object]) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        event_exists = connection.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_exists is None:
            raise KeyError(event_id)
        current = connection.execute(
            "SELECT saved, plan_status, plan_note FROM event_reactions WHERE event_id = ? AND user_id = ?",
            (event_id, actor["id"]),
        ).fetchone()
        next_saved = 0 if current is not None and int(current["saved"]) == 1 else 1
        next_plan_status = None if next_saved == 0 else (str(current["plan_status"]) if current is not None and current["plan_status"] else None)
        next_plan_note = "" if next_saved == 0 else (str(current["plan_note"]) if current is not None and current["plan_note"] else "")
        _upsert_event_reaction(
            connection,
            event_id=event_id,
            user_id=str(actor["id"]),
            saved=next_saved,
            plan_status=next_plan_status,
            plan_note=next_plan_note,
        )
        connection.commit()
        return _event_social_state(connection, event_id, str(actor["id"]))


def set_event_plan_status(event_id: str, actor: dict[str, object], status: str | None) -> dict[str, object]:
    if status is not None and status not in EVENT_PLAN_STATUSES:
        raise ValueError("Unsupported plan status.")
    with closing(_get_connection()) as connection:
        event_exists = connection.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_exists is None:
            raise KeyError(event_id)
        _upsert_event_reaction(
            connection,
            event_id=event_id,
            user_id=str(actor["id"]),
            saved=1 if status else None,
            plan_status=status,
        )
        connection.commit()
        return _event_social_state(connection, event_id, str(actor["id"]))


def set_event_plan_note(event_id: str, actor: dict[str, object], note: str) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        event_exists = connection.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_exists is None:
            raise KeyError(event_id)
        _upsert_event_reaction(
            connection,
            event_id=event_id,
            user_id=str(actor["id"]),
            saved=1,
            plan_note=note.strip(),
        )
        connection.commit()
        return _event_social_state(connection, event_id, str(actor["id"]))


def add_event_comment(event_id: str, actor: dict[str, object], text: str) -> dict[str, object]:
    comment_id = _new_id("event-comment")
    created_at = _utc_now()
    with closing(_get_connection()) as connection:
        event_exists = connection.execute("SELECT 1 FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_exists is None:
            raise KeyError(event_id)
        connection.execute(
            """
            INSERT INTO event_comments (id, event_id, user_id, username, avatar_uri, text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (comment_id, event_id, actor["id"], actor["username"], actor["avatar_uri"], text.strip(), created_at),
        )
        connection.commit()
        return _event_social_state(connection, event_id, str(actor["id"]))


def list_planned_events(user_id: str) -> list[dict[str, object]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT event_id, saved, plan_status, plan_note
            FROM event_reactions
            WHERE user_id = ? AND (saved = 1 OR plan_status IS NOT NULL)
            ORDER BY updated_at DESC
            """,
            (user_id,),
        ).fetchall()
        return [
            {
                "event_id": row["event_id"],
                "saved": bool(row["saved"]),
                "plan_status": row["plan_status"],
                "plan_note": row["plan_note"] or "",
            }
            for row in rows
        ]


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
        rows = connection.execute("SELECT * FROM posts ORDER BY created_at DESC, id DESC").fetchall()
        return [_post_from_row(connection, row) for row in rows]


def _load_post_by_id(connection: sqlite3.Connection, post_id: str) -> dict[str, object] | None:
    row = connection.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
    return _post_from_row(connection, row) if row is not None else None


def upsert_post(post: dict[str, object], actor: dict[str, object]) -> dict[str, object]:
    now = _utc_now()
    post_id = str(post.get("id") or _new_id("post"))
    with closing(_get_connection()) as connection:
        existing = connection.execute("SELECT user_id, created_at FROM posts WHERE id = ?", (post_id,)).fetchone()
        if existing is not None and existing["user_id"] != actor["id"] and actor["role"] != "admin":
            raise PermissionError("You cannot edit this post.")
        created_at = str(existing["created_at"]) if existing is not None else now
        payload = {
            "id": post_id,
            "user_id": str(actor["id"]),
            "username": str(actor["username"]),
            "avatar_uri": str(actor["avatar_uri"]),
            "image_uri": str(post["image_uri"]),
            "date": str(post["date"]),
            "is_beer_finished": 1 if bool(post["is_beer_finished"]) else 0,
            "event_id": post.get("event_id"),
            "event_title": post.get("event_title"),
            "capture_id": post.get("capture_id"),
            "created_at": created_at,
            "updated_at": now,
        }
        connection.execute(
            """
            INSERT INTO posts (
                id, user_id, username, avatar_uri, image_uri, date,
                is_beer_finished, event_id, event_title, capture_id, created_at, updated_at
            )
            VALUES (
                :id, :user_id, :username, :avatar_uri, :image_uri, :date,
                :is_beer_finished, :event_id, :event_title, :capture_id, :created_at, :updated_at
            )
            ON CONFLICT(id) DO UPDATE SET
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
                SET username = COALESCE(?, username), event_id = COALESCE(?, event_id), event_title = COALESCE(?, event_title)
                WHERE id = ?
                """,
                (payload["username"], payload["event_id"], payload["event_title"], payload["capture_id"]),
            )
        connection.commit()
        persisted = _load_post_by_id(connection, post_id)
    if persisted is None:
        raise RuntimeError("Failed to load post after upsert.")
    return persisted


def toggle_post_like(post_id: str, actor: dict[str, object]) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        post_exists = connection.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,)).fetchone()
        if post_exists is None:
            raise KeyError(post_id)
        existing = connection.execute(
            "SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?",
            (post_id, actor["id"]),
        ).fetchone()
        if existing is None:
            connection.execute(
                "INSERT INTO post_likes (post_id, user_id, username, created_at) VALUES (?, ?, ?, ?)",
                (post_id, actor["id"], actor["username"], _utc_now()),
            )
        else:
            connection.execute(
                "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
                (post_id, actor["id"]),
            )
        connection.commit()
        persisted = _load_post_by_id(connection, post_id)
    if persisted is None:
        raise KeyError(post_id)
    return persisted


def add_post_comment(post_id: str, actor: dict[str, object], text: str, time_label: str) -> dict[str, object]:
    comment_id = _new_id("comment")
    created_at = _utc_now()
    with closing(_get_connection()) as connection:
        post_exists = connection.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,)).fetchone()
        if post_exists is None:
            raise KeyError(post_id)
        connection.execute(
            """
            INSERT INTO post_comments (id, post_id, user_id, username, avatar_uri, text, time_label, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (comment_id, post_id, actor["id"], actor["username"], actor["avatar_uri"], text.strip(), time_label, created_at),
        )
        connection.commit()
        persisted = _load_post_by_id(connection, post_id)
    if persisted is None:
        raise KeyError(post_id)
    return persisted


def delete_post(post_id: str, actor: dict[str, object]) -> bool:
    with closing(_get_connection()) as connection:
        row = connection.execute("SELECT user_id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if row is None:
            return False
        if row["user_id"] != actor["id"] and actor["role"] != "admin":
            raise PermissionError("You cannot delete this post.")
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


def create_capture(*, username: str | None, event_id: str | None, event_title: str | None, original_media_path: str, annotated_media_path: str, source: str, summary: dict[str, object], detections: list[dict[str, object]]) -> dict[str, object]:
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
            INSERT INTO capture_detections (capture_id, label, drink_type, confidence, bbox_json, is_drinking)
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
