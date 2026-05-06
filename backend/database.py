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
FRIENDSHIP_STATUSES = {"pending", "accepted", "declined", "blocked", "cancelled"}
GROUP_VISIBILITIES = {"private", "invite_only"}
GROUP_MEMBER_ROLES = {"owner", "admin", "member"}
GROUP_MEMBER_STATUSES = {"invited", "accepted", "declined", "removed"}
LEADERBOARD_PERIODS = {"all_time", "weekly", "monthly"}
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
                crown_count INTEGER NOT NULL DEFAULT 0,
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

            CREATE TABLE IF NOT EXISTS reward_transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount INTEGER NOT NULL,
                reason TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, source_type, source_id, reason),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                consumed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                actor_user_id TEXT,
                actor_username TEXT NOT NULL DEFAULT '',
                actor_avatar_uri TEXT NOT NULL DEFAULT '',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                related_type TEXT,
                related_id TEXT,
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                read_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS friendships (
                id TEXT PRIMARY KEY,
                requester_user_id TEXT NOT NULL,
                addressee_user_id TEXT NOT NULL,
                pair_key TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                responded_at TEXT,
                CHECK (requester_user_id != addressee_user_id),
                FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (addressee_user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                owner_user_id TEXT NOT NULL,
                visibility TEXT NOT NULL DEFAULT 'invite_only',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                archived_at TEXT,
                FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS group_members (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'member',
                status TEXT NOT NULL DEFAULT 'invited',
                invited_by_user_id TEXT,
                joined_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(group_id, user_id),
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS support_requests (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
        _ensure_column(connection, "users", "crown_count", "INTEGER NOT NULL DEFAULT 0")
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
        "crown_count": int(row["crown_count"]) if "crown_count" in row.keys() else 0,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _public_user_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "username": row["username"],
        "full_name": row["full_name"],
        "avatar_uri": row["avatar_uri"],
        "crown_count": int(row["crown_count"]) if "crown_count" in row.keys() else 0,
    }


def _friend_pair_key(user_a_id: str, user_b_id: str) -> str:
    left, right = sorted((user_a_id, user_b_id))
    return f"{left}:{right}"


def _friendship_status_for_user(row: sqlite3.Row, current_user_id: str) -> str:
    status = str(row["status"])
    if status == "accepted":
        return "accepted"
    if status == "pending":
        return "outgoing_pending" if str(row["requester_user_id"]) == current_user_id else "incoming_pending"
    return status


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
        0,
        1,
        now,
        now,
    )

    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO users (
                id, email, username, password_hash, full_name, bio, city, avatar_uri,
                role, crown_count, is_active, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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


def _get_existing_friendship(connection: sqlite3.Connection, user_a_id: str, user_b_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM friendships WHERE pair_key = ?",
        (_friend_pair_key(user_a_id, user_b_id),),
    ).fetchone()


def _friend_request_from_row(connection: sqlite3.Connection, row: sqlite3.Row, current_user_id: str) -> dict[str, object]:
    requester_row = connection.execute("SELECT * FROM users WHERE id = ?", (row["requester_user_id"],)).fetchone()
    addressee_row = connection.execute("SELECT * FROM users WHERE id = ?", (row["addressee_user_id"],)).fetchone()
    if requester_row is None or addressee_row is None:
        raise KeyError("Friendship references missing user.")
    direction = "outgoing" if str(row["requester_user_id"]) == current_user_id else "incoming"
    return {
        "id": row["id"],
        "status": row["status"],
        "direction": direction,
        "requester_user": _public_user_from_row(requester_row),
        "addressee_user": _public_user_from_row(addressee_row),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "responded_at": row["responded_at"],
    }


def search_users(query: str, current_user_id: str, limit: int = 20) -> list[dict[str, object]]:
    normalized_query = query.strip()
    if len(normalized_query) < 2:
        return []
    pattern = f"%{normalized_query.lower()}%"
    safe_limit = max(1, min(limit, 50))
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT id, username, full_name, avatar_uri, crown_count
            FROM users
            WHERE is_active = 1
              AND id != ?
              AND (
                    LOWER(username) LIKE ?
                 OR LOWER(full_name) LIKE ?
                 OR LOWER(email) LIKE ?
              )
            ORDER BY
                CASE
                    WHEN LOWER(username) = ? THEN 0
                    WHEN LOWER(full_name) = ? THEN 1
                    WHEN LOWER(username) LIKE ? THEN 2
                    ELSE 3
                END,
                crown_count DESC,
                username COLLATE NOCASE ASC
            LIMIT ?
            """,
            (
                current_user_id,
                pattern,
                pattern,
                pattern,
                normalized_query.lower(),
                normalized_query.lower(),
                pattern,
                safe_limit,
            ),
        ).fetchall()
        results: list[dict[str, object]] = []
        for row in rows:
            friendship = _get_existing_friendship(connection, current_user_id, str(row["id"]))
            results.append(
                {
                    **_public_user_from_row(row),
                    "friendship_status": _friendship_status_for_user(friendship, current_user_id)
                    if friendship is not None
                    else "none",
                }
            )
        return results


def list_friends(user_id: str) -> list[dict[str, object]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT
                friendships.id AS friendship_id,
                friendships.created_at,
                friendships.updated_at,
                users.id,
                users.username,
                users.full_name,
                users.avatar_uri,
                users.crown_count
            FROM friendships
            JOIN users
              ON users.id = CASE
                    WHEN friendships.requester_user_id = ? THEN friendships.addressee_user_id
                    ELSE friendships.requester_user_id
                END
            WHERE friendships.status = 'accepted'
              AND (friendships.requester_user_id = ? OR friendships.addressee_user_id = ?)
              AND users.is_active = 1
            ORDER BY users.username COLLATE NOCASE ASC
            """,
            (user_id, user_id, user_id),
        ).fetchall()
        return [
            {
                "friendship_id": row["friendship_id"],
                "friend": _public_user_from_row(row),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
            for row in rows
        ]


def list_friend_requests(user_id: str) -> dict[str, list[dict[str, object]]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM friendships
            WHERE status = 'pending' AND (requester_user_id = ? OR addressee_user_id = ?)
            ORDER BY created_at DESC, id DESC
            """,
            (user_id, user_id),
        ).fetchall()
        incoming: list[dict[str, object]] = []
        outgoing: list[dict[str, object]] = []
        for row in rows:
            item = _friend_request_from_row(connection, row, user_id)
            if item["direction"] == "incoming":
                incoming.append(item)
            else:
                outgoing.append(item)
        return {"incoming": incoming, "outgoing": outgoing}


def send_friend_request(current_user_id: str, target_user_id: str) -> dict[str, object]:
    if current_user_id == target_user_id:
        raise ValueError("You cannot send a friend request to yourself.")
    with closing(_get_connection()) as connection:
        target_row = connection.execute(
            "SELECT * FROM users WHERE id = ? AND is_active = 1",
            (target_user_id,),
        ).fetchone()
        actor_row = connection.execute("SELECT * FROM users WHERE id = ?", (current_user_id,)).fetchone()
        if target_row is None or actor_row is None:
            raise KeyError(target_user_id)
        existing = _get_existing_friendship(connection, current_user_id, target_user_id)
        now = _utc_now()
        if existing is not None:
            status = str(existing["status"])
            if status == "accepted":
                raise ValueError("You are already friends.")
            if status == "pending":
                if str(existing["requester_user_id"]) == current_user_id:
                    raise ValueError("A friend request is already pending.")
                connection.execute(
                    "UPDATE friendships SET status = 'accepted', updated_at = ?, responded_at = ? WHERE id = ?",
                    (now, now, existing["id"]),
                )
                _create_notification(
                    connection,
                    user_id=str(existing["requester_user_id"]),
                    actor=_public_user_from_row(actor_row),
                    title="Friend request accepted",
                    message=f"{actor_row['username']} accepted your friend request.",
                    icon="people-outline",
                    color="#0f766e",
                    related_type="friendship",
                    related_id=str(existing["id"]),
                )
                connection.commit()
                row = connection.execute("SELECT * FROM friendships WHERE id = ?", (existing["id"],)).fetchone()
                if row is None:
                    raise RuntimeError("Failed to load friendship after auto-accept.")
                return _friend_request_from_row(connection, row, current_user_id)
            connection.execute(
                """
                UPDATE friendships
                SET requester_user_id = ?, addressee_user_id = ?, status = 'pending', updated_at = ?, responded_at = NULL
                WHERE id = ?
                """,
                (current_user_id, target_user_id, now, existing["id"]),
            )
            friendship_id = str(existing["id"])
        else:
            friendship_id = _new_id("friend")
            connection.execute(
                """
                INSERT INTO friendships (
                    id, requester_user_id, addressee_user_id, pair_key, status, created_at, updated_at, responded_at
                )
                VALUES (?, ?, ?, ?, 'pending', ?, ?, NULL)
                """,
                (
                    friendship_id,
                    current_user_id,
                    target_user_id,
                    _friend_pair_key(current_user_id, target_user_id),
                    now,
                    now,
                ),
            )

        _create_notification(
            connection,
            user_id=target_user_id,
            actor=_public_user_from_row(actor_row),
            title="New friend request",
            message=f"{actor_row['username']} wants to compare crowns with you.",
            icon="person-add-outline",
            color="#d97706",
            related_type="friendship",
            related_id=friendship_id,
        )
        connection.commit()
        row = connection.execute("SELECT * FROM friendships WHERE id = ?", (friendship_id,)).fetchone()
        if row is None:
            raise RuntimeError("Failed to load created friendship.")
        return _friend_request_from_row(connection, row, current_user_id)


def accept_friend_request(request_id: str, current_user_id: str) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        row = connection.execute("SELECT * FROM friendships WHERE id = ?", (request_id,)).fetchone()
        actor_row = connection.execute("SELECT * FROM users WHERE id = ?", (current_user_id,)).fetchone()
        if row is None or actor_row is None:
            raise KeyError(request_id)
        if str(row["addressee_user_id"]) != current_user_id:
            raise PermissionError("You cannot accept this request.")
        if str(row["status"]) != "pending":
            raise ValueError("This friend request is no longer pending.")
        now = _utc_now()
        connection.execute(
            "UPDATE friendships SET status = 'accepted', updated_at = ?, responded_at = ? WHERE id = ?",
            (now, now, request_id),
        )
        _create_notification(
            connection,
            user_id=str(row["requester_user_id"]),
            actor=_public_user_from_row(actor_row),
            title="Friend request accepted",
            message=f"{actor_row['username']} accepted your friend request.",
            icon="people-outline",
            color="#0f766e",
            related_type="friendship",
            related_id=request_id,
        )
        connection.commit()
        updated = connection.execute("SELECT * FROM friendships WHERE id = ?", (request_id,)).fetchone()
        if updated is None:
            raise RuntimeError("Failed to load accepted request.")
        return _friend_request_from_row(connection, updated, current_user_id)


def decline_friend_request(request_id: str, current_user_id: str) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        row = connection.execute("SELECT * FROM friendships WHERE id = ?", (request_id,)).fetchone()
        if row is None:
            raise KeyError(request_id)
        if str(row["addressee_user_id"]) != current_user_id:
            raise PermissionError("You cannot decline this request.")
        if str(row["status"]) != "pending":
            raise ValueError("This friend request is no longer pending.")
        now = _utc_now()
        connection.execute(
            "UPDATE friendships SET status = 'declined', updated_at = ?, responded_at = ? WHERE id = ?",
            (now, now, request_id),
        )
        connection.commit()
        updated = connection.execute("SELECT * FROM friendships WHERE id = ?", (request_id,)).fetchone()
        if updated is None:
            raise RuntimeError("Failed to load declined request.")
        return _friend_request_from_row(connection, updated, current_user_id)


def remove_friend(current_user_id: str, other_user_id: str) -> bool:
    with closing(_get_connection()) as connection:
        row = _get_existing_friendship(connection, current_user_id, other_user_id)
        if row is None:
            return False
        if str(row["status"]) == "pending" and str(row["requester_user_id"]) != current_user_id:
            raise PermissionError("You cannot cancel someone else's request.")
        cursor = connection.execute("DELETE FROM friendships WHERE id = ?", (row["id"],))
        connection.commit()
        return cursor.rowcount > 0


def _is_accepted_friend(connection: sqlite3.Connection, user_a_id: str, user_b_id: str) -> bool:
    row = _get_existing_friendship(connection, user_a_id, user_b_id)
    return row is not None and str(row["status"]) == "accepted"


def _group_summary_from_row(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, object]:
    member_count_row = connection.execute(
        "SELECT COUNT(*) AS count FROM group_members WHERE group_id = ? AND status = 'accepted'",
        (row["id"],),
    ).fetchone()
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "visibility": row["visibility"],
        "owner_user_id": row["owner_user_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "archived_at": row["archived_at"],
        "membership_role": row["membership_role"],
        "membership_status": row["membership_status"],
        "member_count": int(member_count_row["count"]) if member_count_row is not None else 0,
    }


def _group_member_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["membership_id"],
        "user": _public_user_from_row(row),
        "role": row["role"],
        "status": row["status"],
        "invited_by_user_id": row["invited_by_user_id"],
        "joined_at": row["joined_at"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _group_membership_row(connection: sqlite3.Connection, group_id: str, user_id: str) -> sqlite3.Row | None:
    return connection.execute(
        "SELECT * FROM group_members WHERE group_id = ? AND user_id = ?",
        (group_id, user_id),
    ).fetchone()


def list_groups(user_id: str) -> dict[str, list[dict[str, object]]]:
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT groups.*, group_members.role AS membership_role, group_members.status AS membership_status
            FROM group_members
            JOIN groups ON groups.id = group_members.group_id
            WHERE group_members.user_id = ? AND groups.archived_at IS NULL
            ORDER BY
                CASE WHEN group_members.status = 'accepted' THEN 0 ELSE 1 END,
                groups.updated_at DESC,
                groups.name COLLATE NOCASE ASC
            """,
            (user_id,),
        ).fetchall()
        accepted: list[dict[str, object]] = []
        pending_invites: list[dict[str, object]] = []
        for row in rows:
            item = _group_summary_from_row(connection, row)
            if item["membership_status"] == "accepted":
                accepted.append(item)
            elif item["membership_status"] == "invited":
                pending_invites.append(item)
        return {"items": accepted, "pending_invites": pending_invites}


def create_group(
    current_user_id: str,
    *,
    name: str,
    description: str,
    invited_user_ids: list[str] | None = None,
    visibility: str = "invite_only",
) -> dict[str, object]:
    if visibility not in GROUP_VISIBILITIES:
        raise ValueError("Unsupported group visibility.")
    invited_ids = list(dict.fromkeys(invited_user_ids or []))
    now = _utc_now()
    group_id = _new_id("group")
    owner_member_id = _new_id("group-member")
    with closing(_get_connection()) as connection:
        owner_row = connection.execute("SELECT * FROM users WHERE id = ?", (current_user_id,)).fetchone()
        if owner_row is None:
            raise KeyError(current_user_id)
        connection.execute(
            """
            INSERT INTO groups (id, name, description, owner_user_id, visibility, created_at, updated_at, archived_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
            """,
            (group_id, name.strip(), description.strip(), current_user_id, visibility, now, now),
        )
        connection.execute(
            """
            INSERT INTO group_members (
                id, group_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
            )
            VALUES (?, ?, ?, 'owner', 'accepted', ?, ?, ?, ?)
            """,
            (owner_member_id, group_id, current_user_id, current_user_id, now, now, now),
        )
        for invited_user_id in invited_ids:
            if invited_user_id == current_user_id or not _is_accepted_friend(connection, current_user_id, invited_user_id):
                continue
            invite_row = connection.execute(
                "SELECT * FROM users WHERE id = ? AND is_active = 1",
                (invited_user_id,),
            ).fetchone()
            if invite_row is None:
                continue
            connection.execute(
                """
                INSERT OR REPLACE INTO group_members (
                    id, group_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
                )
                VALUES (?, ?, ?, 'member', 'invited', ?, NULL, ?, ?)
                """,
                (_new_id("group-member"), group_id, invited_user_id, current_user_id, now, now),
            )
            _create_notification(
                connection,
                user_id=invited_user_id,
                actor=_public_user_from_row(owner_row),
                title="Group invitation",
                message=f"{owner_row['username']} invited you to join {name.strip()}.",
                icon="people-circle-outline",
                color="#7c3aed",
                related_type="group",
                related_id=group_id,
            )
        connection.commit()
    return get_group(group_id, current_user_id)


def get_group(group_id: str, current_user_id: str) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        if membership is None or str(membership["status"]) not in {"accepted", "invited"}:
            raise PermissionError("You do not have access to this group.")
        row = connection.execute(
            """
            SELECT groups.*, group_members.role AS membership_role, group_members.status AS membership_status
            FROM groups
            JOIN group_members ON group_members.group_id = groups.id
            WHERE groups.id = ? AND group_members.user_id = ? AND groups.archived_at IS NULL
            """,
            (group_id, current_user_id),
        ).fetchone()
        if row is None:
            raise KeyError(group_id)
        member_rows = connection.execute(
            """
            SELECT
                group_members.id AS membership_id,
                group_members.role,
                group_members.status,
                group_members.invited_by_user_id,
                group_members.joined_at,
                group_members.created_at,
                group_members.updated_at,
                users.id,
                users.username,
                users.full_name,
                users.avatar_uri,
                users.crown_count
            FROM group_members
            JOIN users ON users.id = group_members.user_id
            WHERE group_members.group_id = ? AND users.is_active = 1
            ORDER BY
                CASE group_members.role
                    WHEN 'owner' THEN 0
                    WHEN 'admin' THEN 1
                    ELSE 2
                END,
                users.username COLLATE NOCASE ASC
            """,
            (group_id,),
        ).fetchall()
        summary = _group_summary_from_row(connection, row)
        return {
            **summary,
            "current_user_role": summary["membership_role"],
            "current_user_status": summary["membership_status"],
            "members": [_group_member_from_row(member_row) for member_row in member_rows],
        }


def update_group(group_id: str, current_user_id: str, *, name: str | None = None, description: str | None = None) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        if membership is None or str(membership["status"]) != "accepted" or str(membership["role"]) not in {"owner", "admin"}:
            raise PermissionError("You cannot update this group.")
        group_row = connection.execute("SELECT * FROM groups WHERE id = ? AND archived_at IS NULL", (group_id,)).fetchone()
        if group_row is None:
            raise KeyError(group_id)
        next_name = str(name).strip() if name is not None else str(group_row["name"])
        next_description = str(description).strip() if description is not None else str(group_row["description"])
        connection.execute(
            "UPDATE groups SET name = ?, description = ?, updated_at = ? WHERE id = ?",
            (next_name, next_description, _utc_now(), group_id),
        )
        connection.commit()
    return get_group(group_id, current_user_id)


def archive_group(group_id: str, current_user_id: str) -> bool:
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        if membership is None or str(membership["role"]) != "owner" or str(membership["status"]) != "accepted":
            raise PermissionError("Only the owner can archive this group.")
        cursor = connection.execute(
            "UPDATE groups SET archived_at = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL",
            (_utc_now(), _utc_now(), group_id),
        )
        connection.commit()
        return cursor.rowcount > 0


def list_group_members(group_id: str, current_user_id: str) -> list[dict[str, object]]:
    return get_group(group_id, current_user_id)["members"]


def invite_group_members(group_id: str, current_user_id: str, user_ids: list[str]) -> dict[str, object]:
    candidate_ids = list(dict.fromkeys(user_ids))
    if not candidate_ids:
        return get_group(group_id, current_user_id)
    now = _utc_now()
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        actor_row = connection.execute("SELECT * FROM users WHERE id = ?", (current_user_id,)).fetchone()
        group_row = connection.execute("SELECT * FROM groups WHERE id = ? AND archived_at IS NULL", (group_id,)).fetchone()
        if membership is None or str(membership["status"]) != "accepted" or str(membership["role"]) not in {"owner", "admin"}:
            raise PermissionError("You cannot invite members to this group.")
        if actor_row is None or group_row is None:
            raise KeyError(group_id)
        for invited_user_id in candidate_ids:
            if invited_user_id == current_user_id or not _is_accepted_friend(connection, current_user_id, invited_user_id):
                continue
            user_row = connection.execute(
                "SELECT * FROM users WHERE id = ? AND is_active = 1",
                (invited_user_id,),
            ).fetchone()
            if user_row is None:
                continue
            existing = _group_membership_row(connection, group_id, invited_user_id)
            if existing is not None and str(existing["status"]) in {"accepted", "invited"}:
                continue
            if existing is None:
                connection.execute(
                    """
                    INSERT INTO group_members (
                        id, group_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
                    )
                    VALUES (?, ?, ?, 'member', 'invited', ?, NULL, ?, ?)
                    """,
                    (_new_id("group-member"), group_id, invited_user_id, current_user_id, now, now),
                )
            else:
                connection.execute(
                    """
                    UPDATE group_members
                    SET role = 'member', status = 'invited', invited_by_user_id = ?, joined_at = NULL, updated_at = ?
                    WHERE id = ?
                    """,
                    (current_user_id, now, existing["id"]),
                )
            _create_notification(
                connection,
                user_id=invited_user_id,
                actor=_public_user_from_row(actor_row),
                title="Group invitation",
                message=f"{actor_row['username']} invited you to join {group_row['name']}.",
                icon="people-circle-outline",
                color="#7c3aed",
                related_type="group",
                related_id=group_id,
            )
        connection.commit()
    return get_group(group_id, current_user_id)


def accept_group_invite(group_id: str, current_user_id: str) -> dict[str, object]:
    now = _utc_now()
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        actor_row = connection.execute("SELECT * FROM users WHERE id = ?", (current_user_id,)).fetchone()
        group_row = connection.execute("SELECT * FROM groups WHERE id = ? AND archived_at IS NULL", (group_id,)).fetchone()
        if membership is None or group_row is None or actor_row is None:
            raise KeyError(group_id)
        if str(membership["status"]) != "invited":
            raise ValueError("This group invitation is no longer pending.")
        connection.execute(
            "UPDATE group_members SET status = 'accepted', joined_at = ?, updated_at = ? WHERE id = ?",
            (now, now, membership["id"]),
        )
        inviter_id = membership["invited_by_user_id"]
        if inviter_id:
            _create_notification(
                connection,
                user_id=str(inviter_id),
                actor=_public_user_from_row(actor_row),
                title="Group invite accepted",
                message=f"{actor_row['username']} joined {group_row['name']}.",
                icon="people-outline",
                color="#0f766e",
                related_type="group",
                related_id=group_id,
            )
        connection.commit()
    return get_group(group_id, current_user_id)


def decline_group_invite(group_id: str, current_user_id: str) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        if membership is None:
            raise KeyError(group_id)
        if str(membership["status"]) != "invited":
            raise ValueError("This group invitation is no longer pending.")
        connection.execute(
            "UPDATE group_members SET status = 'declined', updated_at = ? WHERE id = ?",
            (_utc_now(), membership["id"]),
        )
        connection.commit()
    return {"group_id": group_id, "status": "declined"}


def remove_group_member(group_id: str, current_user_id: str, target_user_id: str) -> bool:
    with closing(_get_connection()) as connection:
        actor_membership = _group_membership_row(connection, group_id, current_user_id)
        target_membership = _group_membership_row(connection, group_id, target_user_id)
        if target_membership is None:
            return False
        if actor_membership is None:
            raise PermissionError("You do not have access to this group.")
        actor_role = str(actor_membership["role"])
        actor_status = str(actor_membership["status"])
        target_role = str(target_membership["role"])
        if actor_status != "accepted":
            raise PermissionError("You do not have access to this group.")
        if target_user_id == current_user_id:
            if target_role == "owner":
                raise ValueError("Transfer ownership or archive the group before leaving.")
            cursor = connection.execute("DELETE FROM group_members WHERE id = ?", (target_membership["id"],))
            connection.commit()
            return cursor.rowcount > 0
        if actor_role not in {"owner", "admin"}:
            raise PermissionError("You cannot remove this member.")
        if actor_role == "admin" and target_role in {"owner", "admin"}:
            raise PermissionError("Admins cannot remove owners or other admins.")
        cursor = connection.execute("DELETE FROM group_members WHERE id = ?", (target_membership["id"],))
        target_user = connection.execute("SELECT * FROM users WHERE id = ?", (target_user_id,)).fetchone()
        actor_user = connection.execute("SELECT * FROM users WHERE id = ?", (current_user_id,)).fetchone()
        group_row = connection.execute("SELECT * FROM groups WHERE id = ?", (group_id,)).fetchone()
        if cursor.rowcount > 0 and target_user is not None and actor_user is not None and group_row is not None:
            _create_notification(
                connection,
                user_id=target_user_id,
                actor=_public_user_from_row(actor_user),
                title="Removed from group",
                message=f"{actor_user['username']} removed you from {group_row['name']}.",
                icon="person-remove-outline",
                color="#b91c1c",
                related_type="group",
                related_id=group_id,
            )
        connection.commit()
        return cursor.rowcount > 0


def update_group_member_role(group_id: str, current_user_id: str, target_user_id: str, role: str) -> dict[str, object]:
    if role not in {"admin", "member"}:
        raise ValueError("Unsupported group member role.")
    with closing(_get_connection()) as connection:
        actor_membership = _group_membership_row(connection, group_id, current_user_id)
        target_membership = _group_membership_row(connection, group_id, target_user_id)
        if actor_membership is None or target_membership is None:
            raise KeyError(group_id)
        if str(actor_membership["role"]) != "owner" or str(actor_membership["status"]) != "accepted":
            raise PermissionError("Only the owner can change member roles.")
        if str(target_membership["role"]) == "owner":
            raise ValueError("The owner role cannot be reassigned here.")
        connection.execute(
            "UPDATE group_members SET role = ?, updated_at = ? WHERE id = ?",
            (role, _utc_now(), target_membership["id"]),
        )
        connection.commit()
    return get_group(group_id, current_user_id)


def get_group_leaderboard(group_id: str, current_user_id: str, period: str = "all_time", limit: int = 50) -> dict[str, object]:
    normalized_period = period if period in LEADERBOARD_PERIODS else "all_time"
    safe_limit = max(1, min(limit, 50))
    with closing(_get_connection()) as connection:
        membership = _group_membership_row(connection, group_id, current_user_id)
        if membership is None or str(membership["status"]) != "accepted":
            raise PermissionError("You cannot view this leaderboard.")
        if normalized_period == "weekly":
            window_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(timespec="seconds")
        elif normalized_period == "monthly":
            window_start = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat(timespec="seconds")
        else:
            window_start = None
        order_by = (
            "period_crowns DESC, users.crown_count DESC, COALESCE(group_members.joined_at, users.created_at) ASC, users.username COLLATE NOCASE ASC"
            if normalized_period in {"weekly", "monthly"}
            else "users.crown_count DESC, COALESCE(group_members.joined_at, users.created_at) ASC, users.username COLLATE NOCASE ASC"
        )
        rows = connection.execute(
            f"""
            SELECT
                users.id,
                users.username,
                users.full_name,
                users.avatar_uri,
                users.crown_count,
                users.created_at,
                group_members.joined_at,
                COALESCE(SUM(
                    CASE
                        WHEN ? IS NULL OR reward_transactions.created_at >= ? THEN reward_transactions.amount
                        ELSE 0
                    END
                ), 0) AS period_crowns
            FROM group_members
            JOIN users ON users.id = group_members.user_id
            LEFT JOIN reward_transactions ON reward_transactions.user_id = users.id
            WHERE group_members.group_id = ?
              AND group_members.status = 'accepted'
              AND users.is_active = 1
            GROUP BY users.id, users.username, users.full_name, users.avatar_uri, users.crown_count, users.created_at, group_members.joined_at
            ORDER BY {order_by}
            LIMIT ?
            """,
            (window_start, window_start, group_id, safe_limit),
        ).fetchall()
        entries: list[dict[str, object]] = []
        last_score: tuple[int, int] | None = None
        current_rank = 0
        for index, row in enumerate(rows, start=1):
            crown_count = int(row["crown_count"])
            period_crowns = crown_count if normalized_period == "all_time" else int(row["period_crowns"])
            score = (period_crowns, crown_count) if normalized_period in {"weekly", "monthly"} else (crown_count, period_crowns)
            if score != last_score:
                current_rank = index
                last_score = score
            entries.append(
                {
                    "rank": current_rank,
                    "user_id": row["id"],
                    "display_name": row["full_name"] or row["username"],
                    "avatar_url": row["avatar_uri"],
                    "crown_count": crown_count,
                    "period_crowns": period_crowns,
                    "is_current_user": str(row["id"]) == current_user_id,
                }
            )
        return {
            "group_id": group_id,
            "period": normalized_period,
            "generated_at": _utc_now(),
            "entries": entries,
        }


def _create_notification(
    connection: sqlite3.Connection,
    *,
    user_id: str,
    actor: dict[str, object] | None,
    title: str,
    message: str,
    icon: str,
    color: str,
    related_type: str | None = None,
    related_id: str | None = None,
) -> dict[str, object]:
    notification_id = _new_id("notification")
    created_at = _utc_now()
    actor_username = str(actor["username"]) if actor is not None else ""
    actor_avatar_uri = str(actor["avatar_uri"]) if actor is not None else ""
    actor_user_id = str(actor["id"]) if actor is not None else None
    connection.execute(
        """
        INSERT INTO notifications (
            id, user_id, actor_user_id, actor_username, actor_avatar_uri, title, message,
            icon, color, related_type, related_id, is_read, created_at, read_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)
        """,
        (
            notification_id,
            user_id,
            actor_user_id,
            actor_username,
            actor_avatar_uri,
            title.strip(),
            message.strip(),
            icon,
            color,
            related_type,
            related_id,
            created_at,
        ),
    )
    row = connection.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,)).fetchone()
    if row is None:
        raise RuntimeError("Failed to load notification after insert.")
    return _notification_from_row(row)


def _notification_from_row(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "actor_username": row["actor_username"],
        "actor_avatar_uri": row["actor_avatar_uri"],
        "title": row["title"],
        "message": row["message"],
        "icon": row["icon"],
        "color": row["color"],
        "related_type": row["related_type"],
        "related_id": row["related_id"],
        "is_read": bool(row["is_read"]),
        "created_at": row["created_at"],
    }


def list_notifications(user_id: str, limit: int = 50) -> list[dict[str, object]]:
    safe_limit = max(1, min(limit, 100))
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
            (user_id, safe_limit),
        ).fetchall()
        return [_notification_from_row(row) for row in rows]


def get_unread_notification_count(user_id: str) -> int:
    with closing(_get_connection()) as connection:
        row = connection.execute(
            "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
            (user_id,),
        ).fetchone()
        return int(row["count"]) if row is not None else 0


def mark_all_notifications_read(user_id: str) -> int:
    with closing(_get_connection()) as connection:
        cursor = connection.execute(
            "UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0",
            (_utc_now(), user_id),
        )
        connection.commit()
        return int(cursor.rowcount)


def create_activity_notification(
    user_id: str,
    *,
    actor: dict[str, object] | None,
    title: str,
    message: str,
    icon: str,
    color: str,
    related_type: str | None = None,
    related_id: str | None = None,
) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        notification = _create_notification(
            connection,
            user_id=user_id,
            actor=actor,
            title=title,
            message=message,
            icon=icon,
            color=color,
            related_type=related_type,
            related_id=related_id,
        )
        connection.commit()
        return notification


def award_crowns(
    connection: sqlite3.Connection,
    *,
    user_id: str,
    amount: int,
    reason: str,
    source_type: str,
    source_id: str,
) -> bool:
    reward_id = _new_id("reward")
    try:
        connection.execute(
            """
            INSERT INTO reward_transactions (id, user_id, amount, reason, source_type, source_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (reward_id, user_id, amount, reason, source_type, source_id, _utc_now()),
        )
    except sqlite3.IntegrityError:
        return False

    connection.execute(
        "UPDATE users SET crown_count = crown_count + ?, updated_at = ? WHERE id = ?",
        (amount, _utc_now(), user_id),
    )
    return True


def list_reward_history(user_id: str, limit: int = 25) -> list[dict[str, object]]:
    safe_limit = max(1, min(limit, 100))
    with closing(_get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT id, amount, reason, source_type, source_id, created_at
            FROM reward_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (user_id, safe_limit),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "amount": int(row["amount"]),
                "reason": row["reason"],
                "source_type": row["source_type"],
                "source_id": row["source_id"],
                "created_at": row["created_at"],
            }
            for row in rows
        ]


def get_reward_state(user_id: str) -> dict[str, object]:
    user = get_user_by_id(user_id)
    if user is None:
        raise KeyError(user_id)
    return {
        "crown_count": int(user["crown_count"]),
        "history": list_reward_history(user_id),
    }


def create_password_reset_token(email: str, ttl_minutes: int) -> str | None:
    user = get_user_by_email(email)
    if user is None:
        return None

    token = generate_session_token()
    token_hash = hash_session_token(token)
    token_id = _new_id("reset")
    now = _utc_now()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)).isoformat(timespec="seconds")

    with closing(_get_connection()) as connection:
        connection.execute(
            "DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= ? OR consumed_at IS NOT NULL",
            (str(user["id"]), now),
        )
        connection.execute(
            """
            INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at, consumed_at)
            VALUES (?, ?, ?, ?, ?, NULL)
            """,
            (token_id, str(user["id"]), token_hash, expires_at, now),
        )
        connection.commit()
    return token


def consume_password_reset_token(token: str, new_password: str) -> bool:
    token_hash = hash_session_token(token)
    now = _utc_now()
    with closing(_get_connection()) as connection:
        row = connection.execute(
            """
            SELECT user_id
            FROM password_reset_tokens
            WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?
            """,
            (token_hash, now),
        ).fetchone()
        if row is None:
            return False
        user_id = str(row["user_id"])
        connection.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? AND is_active = 1",
            (hash_password(new_password), now, user_id),
        )
        connection.execute(
            "UPDATE password_reset_tokens SET consumed_at = ? WHERE token_hash = ?",
            (now, token_hash),
        )
        connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        connection.commit()
        return True


def create_support_request(*, email: str, subject: str, message: str, user_id: str | None = None) -> dict[str, object]:
    request_id = _new_id("support")
    created_at = _utc_now()
    with closing(_get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO support_requests (id, user_id, email, subject, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'open', ?)
            """,
            (request_id, user_id, email.strip().lower(), subject.strip(), message.strip(), created_at),
        )
        connection.commit()
    return {"id": request_id, "message": "Support request received."}


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
        event_row = connection.execute("SELECT created_by_user_id, title FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_row is None:
            raise KeyError(event_id)
        current = connection.execute(
            "SELECT liked FROM event_reactions WHERE event_id = ? AND user_id = ?",
            (event_id, actor["id"]),
        ).fetchone()
        next_liked = 0 if current is not None and int(current["liked"]) == 1 else 1
        _upsert_event_reaction(connection, event_id=event_id, user_id=str(actor["id"]), liked=next_liked)
        owner_id = event_row["created_by_user_id"]
        if next_liked == 1 and owner_id and owner_id != actor["id"]:
            _create_notification(
                connection,
                user_id=str(owner_id),
                actor=actor,
                title="Event liked",
                message=f"{actor['username']} liked {event_row['title']}.",
                icon="heart",
                color="#e45b5b",
                related_type="event",
                related_id=event_id,
            )
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
        event_row = connection.execute("SELECT title FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_row is None:
            raise KeyError(event_id)
        _upsert_event_reaction(
            connection,
            event_id=event_id,
            user_id=str(actor["id"]),
            saved=1 if status else None,
            plan_status=status,
        )
        if status:
            _create_notification(
                connection,
                user_id=str(actor["id"]),
                actor=actor,
                title="Plan updated",
                message=f"You marked {event_row['title']} as {status}.",
                icon="calendar",
                color="#0f766e" if status == "going" else "#f47b20",
                related_type="event",
                related_id=event_id,
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
        event_row = connection.execute("SELECT created_by_user_id, title FROM events WHERE id = ?", (event_id,)).fetchone()
        if event_row is None:
            raise KeyError(event_id)
        connection.execute(
            """
            INSERT INTO event_comments (id, event_id, user_id, username, avatar_uri, text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (comment_id, event_id, actor["id"], actor["username"], actor["avatar_uri"], text.strip(), created_at),
        )
        owner_id = event_row["created_by_user_id"]
        if owner_id and owner_id != actor["id"]:
            _create_notification(
                connection,
                user_id=str(owner_id),
                actor=actor,
                title="New event comment",
                message=f"{actor['username']} commented on {event_row['title']}.",
                icon="chatbubble-ellipses-outline",
                color="#0f766e",
                related_type="event",
                related_id=event_id,
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
        "crown_awarded": False,
        "crown_count": None,
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
    crown_awarded = False
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
        if payload["is_beer_finished"]:
            reward_source_type = "capture" if payload["capture_id"] else "post"
            reward_source_id = str(payload["capture_id"] or post_id)
            crown_awarded = award_crowns(
                connection,
                user_id=str(actor["id"]),
                amount=1,
                reason="qualifying_capture_post",
                source_type=reward_source_type,
                source_id=reward_source_id,
            )
            if crown_awarded:
                _create_notification(
                    connection,
                    user_id=str(actor["id"]),
                    actor=actor,
                    title="Crown earned",
                    message=f"You earned a crown for {payload['event_title'] or 'your latest capture'}.",
                    icon="ribbon",
                    color="#f47b20",
                    related_type="post",
                    related_id=post_id,
                )
        connection.commit()
        persisted = _load_post_by_id(connection, post_id)
        crown_count_row = connection.execute("SELECT crown_count FROM users WHERE id = ?", (actor["id"],)).fetchone()
    if persisted is None:
        raise RuntimeError("Failed to load post after upsert.")
    persisted["crown_awarded"] = crown_awarded
    persisted["crown_count"] = int(crown_count_row["crown_count"]) if crown_count_row is not None else None
    return persisted


def toggle_post_like(post_id: str, actor: dict[str, object]) -> dict[str, object]:
    with closing(_get_connection()) as connection:
        post_row = connection.execute("SELECT user_id, event_title FROM posts WHERE id = ?", (post_id,)).fetchone()
        if post_row is None:
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
            if post_row["user_id"] != actor["id"]:
                _create_notification(
                    connection,
                    user_id=str(post_row["user_id"]),
                    actor=actor,
                    title="Post liked",
                    message=f"{actor['username']} liked your post.",
                    icon="heart",
                    color="#e45b5b",
                    related_type="post",
                    related_id=post_id,
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
        post_row = connection.execute("SELECT user_id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if post_row is None:
            raise KeyError(post_id)
        connection.execute(
            """
            INSERT INTO post_comments (id, post_id, user_id, username, avatar_uri, text, time_label, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (comment_id, post_id, actor["id"], actor["username"], actor["avatar_uri"], text.strip(), time_label, created_at),
        )
        if post_row["user_id"] != actor["id"]:
            _create_notification(
                connection,
                user_id=str(post_row["user_id"]),
                actor=actor,
                title="New post comment",
                message=f"{actor['username']} commented on your post.",
                icon="chatbubble-ellipses-outline",
                color="#0f766e",
                related_type="post",
                related_id=post_id,
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
