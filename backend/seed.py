"""Development seed data for EventCapture."""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass

try:
    from .config import DATABASE_PATH
    from .database import (
        accept_friend_request,
        accept_group_invite,
        create_group,
        create_user,
        get_user_by_email,
        init_database,
        invite_group_members,
        send_friend_request,
        upsert_event,
        upsert_post,
    )
except ImportError:
    from config import DATABASE_PATH
    from database import (
        accept_friend_request,
        accept_group_invite,
        create_group,
        create_user,
        get_user_by_email,
        init_database,
        invite_group_members,
        send_friend_request,
        upsert_event,
        upsert_post,
    )


@dataclass(frozen=True)
class SeedUser:
    email: str
    username: str
    password: str
    full_name: str
    city: str
    bio: str
    avatar_uri: str
    role: str = "user"


@dataclass(frozen=True)
class SeedFriendship:
    requester_email: str
    addressee_email: str
    status: str = "accepted"


@dataclass(frozen=True)
class SeedGroup:
    name: str
    description: str
    owner_email: str
    accepted_member_emails: tuple[str, ...] = ()
    invited_member_emails: tuple[str, ...] = ()


SEED_USERS = [
    SeedUser(
        email="admin@eventcapture.app",
        username="admin",
        password="AdminPass123!",
        full_name="Platform Admin",
        city="Brussels",
        bio="Operational access for moderation and QA.",
        avatar_uri="https://i.pravatar.cc/160?img=68",
        role="admin",
    ),
    SeedUser(
        email="organizer@eventcapture.app",
        username="organizer",
        password="Organizer123!",
        full_name="Brussels Organizer",
        city="Brussels",
        bio="Curating nights that actually feel memorable.",
        avatar_uri="https://i.pravatar.cc/160?img=12",
    ),
    SeedUser(
        email="guest@eventcapture.app",
        username="guest",
        password="GuestPass123!",
        full_name="Event Guest",
        city="Brussels",
        bio="Always chasing the next good event.",
        avatar_uri="https://i.pravatar.cc/160?img=32",
    ),
    SeedUser(
        email="lena@eventcapture.app",
        username="lena",
        password="LenaPass123!",
        full_name="Lena Vermeer",
        city="Brussels",
        bio="Likes rooftop nights and clean leaderboard races.",
        avatar_uri="https://i.pravatar.cc/160?img=47",
    ),
    SeedUser(
        email="marco@eventcapture.app",
        username="marco",
        password="MarcoPass123!",
        full_name="Marco Duran",
        city="Antwerp",
        bio="Shows up late, still wants the crown.",
        avatar_uri="https://i.pravatar.cc/160?img=14",
    ),
    SeedUser(
        email="nina@eventcapture.app",
        username="nina",
        password="NinaPass123!",
        full_name="Nina Laurent",
        city="Ghent",
        bio="Keeps group challenges honest and competitive.",
        avatar_uri="https://i.pravatar.cc/160?img=21",
    ),
    SeedUser(
        email="sam@eventcapture.app",
        username="sam",
        password="SamPass123!",
        full_name="Sam Ortega",
        city="Brussels",
        bio="Never misses a tasting night.",
        avatar_uri="https://i.pravatar.cc/160?img=39",
    ),
    SeedUser(
        email="tom@eventcapture.app",
        username="tom",
        password="TomPass123!",
        full_name="Tom De Wilde",
        city="Leuven",
        bio="Still trying to join the right crew.",
        avatar_uri="https://i.pravatar.cc/160?img=25",
    ),
]

SEED_FRIENDSHIPS = [
    SeedFriendship("organizer@eventcapture.app", "guest@eventcapture.app"),
    SeedFriendship("organizer@eventcapture.app", "lena@eventcapture.app"),
    SeedFriendship("organizer@eventcapture.app", "nina@eventcapture.app"),
    SeedFriendship("organizer@eventcapture.app", "sam@eventcapture.app"),
    SeedFriendship("guest@eventcapture.app", "marco@eventcapture.app"),
    SeedFriendship("guest@eventcapture.app", "nina@eventcapture.app"),
    SeedFriendship("guest@eventcapture.app", "lena@eventcapture.app"),
    SeedFriendship("lena@eventcapture.app", "marco@eventcapture.app"),
    SeedFriendship("sam@eventcapture.app", "nina@eventcapture.app"),
    SeedFriendship("marco@eventcapture.app", "organizer@eventcapture.app", status="pending"),
    SeedFriendship("tom@eventcapture.app", "guest@eventcapture.app", status="pending"),
]

SEED_GROUPS = [
    SeedGroup(
        name="Weekend Crew",
        description="The people who actually show up and compare crowns after midnight.",
        owner_email="guest@eventcapture.app",
        accepted_member_emails=("lena@eventcapture.app", "marco@eventcapture.app"),
        invited_member_emails=("nina@eventcapture.app",),
    ),
    SeedGroup(
        name="Craft League",
        description="A smaller circle for tasting nights and steady crown progress.",
        owner_email="organizer@eventcapture.app",
        accepted_member_emails=("guest@eventcapture.app", "nina@eventcapture.app"),
        invited_member_emails=("sam@eventcapture.app",),
    ),
]


def _connect() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def ensure_user(seed_user: SeedUser) -> dict[str, object]:
    existing = get_user_by_email(seed_user.email)
    if existing is not None:
        return existing
    return create_user(
        email=seed_user.email,
        username=seed_user.username,
        password=seed_user.password,
        full_name=seed_user.full_name,
        city=seed_user.city,
        bio=seed_user.bio,
        avatar_uri=seed_user.avatar_uri,
        role=seed_user.role,
    )


def _pair_key(user_a_id: str, user_b_id: str) -> str:
    left, right = sorted((user_a_id, user_b_id))
    return f"{left}:{right}"


def _friendship_row(user_a_id: str, user_b_id: str) -> sqlite3.Row | None:
    with _connect() as connection:
        return connection.execute(
            "SELECT * FROM friendships WHERE pair_key = ?",
            (_pair_key(user_a_id, user_b_id),),
        ).fetchone()


def ensure_friendship(users_by_email: dict[str, dict[str, object]], seed_friendship: SeedFriendship) -> None:
    requester = users_by_email[seed_friendship.requester_email]
    addressee = users_by_email[seed_friendship.addressee_email]
    existing = _friendship_row(str(requester["id"]), str(addressee["id"]))

    if existing is None:
        created = send_friend_request(str(requester["id"]), str(addressee["id"]))
        request_id = str(created["id"])
        if seed_friendship.status == "accepted":
            accept_friend_request(request_id, str(addressee["id"]))
        return

    status = str(existing["status"])
    if seed_friendship.status == "accepted" and status != "accepted":
        if status == "pending" and str(existing["addressee_user_id"]) == str(addressee["id"]):
            accept_friend_request(str(existing["id"]), str(addressee["id"]))


def _group_row(owner_user_id: str, name: str) -> sqlite3.Row | None:
    with _connect() as connection:
        return connection.execute(
            "SELECT * FROM groups WHERE owner_user_id = ? AND name = ? AND archived_at IS NULL",
            (owner_user_id, name),
        ).fetchone()


def _group_membership_row(group_id: str, user_id: str) -> sqlite3.Row | None:
    with _connect() as connection:
        return connection.execute(
            "SELECT * FROM group_members WHERE group_id = ? AND user_id = ?",
            (group_id, user_id),
        ).fetchone()


def ensure_group(users_by_email: dict[str, dict[str, object]], seed_group: SeedGroup) -> str:
    owner = users_by_email[seed_group.owner_email]
    group_row = _group_row(str(owner["id"]), seed_group.name)

    invited_ids = [
        str(users_by_email[email]["id"])
        for email in (*seed_group.accepted_member_emails, *seed_group.invited_member_emails)
        if email in users_by_email
    ]

    if group_row is None:
        created = create_group(
            str(owner["id"]),
            name=seed_group.name,
            description=seed_group.description,
            invited_user_ids=invited_ids,
        )
        group_id = str(created["id"])
    else:
        group_id = str(group_row["id"])
        if invited_ids:
            invite_group_members(group_id, str(owner["id"]), invited_ids)

    for accepted_email in seed_group.accepted_member_emails:
        member = users_by_email[accepted_email]
        membership = _group_membership_row(group_id, str(member["id"]))
        if membership is not None and str(membership["status"]) == "invited":
            accept_group_invite(group_id, str(member["id"]))

    return group_id


def ensure_post(post_id: str, actor: dict[str, object], event_id: str, event_title: str, image_uri: str, capture_id: str, date: str) -> None:
    upsert_post(
        {
            "id": post_id,
            "image_uri": image_uri,
            "date": date,
            "is_beer_finished": True,
            "event_id": event_id,
            "event_title": event_title,
            "capture_id": capture_id,
        },
        actor,
    )


def seed() -> None:
    init_database()
    users_by_email = {seed_user.email: ensure_user(seed_user) for seed_user in SEED_USERS}

    organizer = users_by_email["organizer@eventcapture.app"]
    guest = users_by_email["guest@eventcapture.app"]
    lena = users_by_email["lena@eventcapture.app"]
    marco = users_by_email["marco@eventcapture.app"]
    nina = users_by_email["nina@eventcapture.app"]
    sam = users_by_email["sam@eventcapture.app"]

    rooftop = upsert_event(
        {
            "id": "seed-rooftop-session",
            "title": "Seed Rooftop Session",
            "short_title": "Seed rooftop night",
            "date": "18 Jul",
            "full_date": "Friday 18 July 2026",
            "time": "20:30 - 01:00",
            "place": "Ixelles",
            "address": "Belvedere Rooftop, Ixelles",
            "attendees": "0 going",
            "attendee_count": 0,
            "price": "18 EUR",
            "price_label": "18 EUR pre-sale",
            "vibe": "Live set, rooftop",
            "experience": "Open air",
            "hero_image": "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80",
            "host_name": organizer["full_name"],
            "host_avatar": organizer["avatar_uri"],
            "badge": "TRENDING TONIGHT",
            "description": "A seeded event for development and QA flows.",
            "tags": ["Live music", "Open air", "Rooftop", "Seed"],
        },
        organizer,
    )

    tasting = upsert_event(
        {
            "id": "seed-afterwork-tasting",
            "title": "Seed Afterwork Tasting",
            "short_title": "Seed tasting night",
            "date": "14 Sep",
            "full_date": "Monday 14 September 2026",
            "time": "18:30 - 23:00",
            "place": "Brussels Center",
            "address": "Hop Hall, Brussels Center",
            "attendees": "0 going",
            "attendee_count": 0,
            "price": "12 EUR",
            "price_label": "12 EUR tasting pass",
            "vibe": "Craft beer, social",
            "experience": "Tasting night",
            "hero_image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1400&q=80",
            "host_name": organizer["full_name"],
            "host_avatar": organizer["avatar_uri"],
            "badge": "AFTERWORK",
            "description": "A second seeded event so the feed and discovery tabs are not empty in dev.",
            "tags": ["Craft beer", "Social", "Afterwork", "Seed"],
        },
        organizer,
    )

    cellar = upsert_event(
        {
            "id": "seed-cellar-finals",
            "title": "Seed Cellar Finals",
            "short_title": "Seed cellar finals",
            "date": "02 Nov",
            "full_date": "Saturday 02 November 2026",
            "time": "21:00 - 02:30",
            "place": "Saint-Gilles",
            "address": "Copper Cellar, Saint-Gilles",
            "attendees": "0 going",
            "attendee_count": 0,
            "price": "15 EUR",
            "price_label": "15 EUR door ticket",
            "vibe": "Late night, loud, close friends",
            "experience": "Basement party",
            "hero_image": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80",
            "host_name": organizer["full_name"],
            "host_avatar": organizer["avatar_uri"],
            "badge": "LATE PICK",
            "description": "A seeded late-night event for social and leaderboard QA.",
            "tags": ["Basement", "Late night", "Social", "Seed"],
        },
        organizer,
    )

    for friendship in SEED_FRIENDSHIPS:
        ensure_friendship(users_by_email, friendship)

    seeded_group_ids = [ensure_group(users_by_email, seed_group) for seed_group in SEED_GROUPS]

    ensure_post(
        "seed-post-guest-1",
        guest,
        rooftop["id"],
        rooftop["title"],
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
        "seed-capture-guest-1",
        "18/07/2026",
    )
    ensure_post(
        "seed-post-guest-2",
        guest,
        tasting["id"],
        tasting["title"],
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
        "seed-capture-guest-2",
        "14/09/2026",
    )
    ensure_post(
        "seed-post-lena-1",
        lena,
        rooftop["id"],
        rooftop["title"],
        "https://images.unsplash.com/photo-1532635241-17e820acc59f?auto=format&fit=crop&w=900&q=80",
        "seed-capture-lena-1",
        "18/07/2026",
    )
    ensure_post(
        "seed-post-lena-2",
        lena,
        cellar["id"],
        cellar["title"],
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
        "seed-capture-lena-2",
        "02/11/2026",
    )
    ensure_post(
        "seed-post-lena-3",
        lena,
        tasting["id"],
        tasting["title"],
        "https://images.unsplash.com/photo-1525268323446-0505b6fe7778?auto=format&fit=crop&w=900&q=80",
        "seed-capture-lena-3",
        "14/09/2026",
    )
    ensure_post(
        "seed-post-marco-1",
        marco,
        cellar["id"],
        cellar["title"],
        "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=900&q=80",
        "seed-capture-marco-1",
        "02/11/2026",
    )
    ensure_post(
        "seed-post-nina-1",
        nina,
        tasting["id"],
        tasting["title"],
        "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
        "seed-capture-nina-1",
        "14/09/2026",
    )
    ensure_post(
        "seed-post-nina-2",
        nina,
        rooftop["id"],
        rooftop["title"],
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
        "seed-capture-nina-2",
        "18/07/2026",
    )
    ensure_post(
        "seed-post-sam-1",
        sam,
        tasting["id"],
        tasting["title"],
        "https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=900&q=80",
        "seed-capture-sam-1",
        "14/09/2026",
    )

    print("Seeded users:")
    for item in SEED_USERS:
        print(f"  {item.email} / {item.password}")

    print("\nSeeded friendships:")
    for item in SEED_FRIENDSHIPS:
        print(f"  {item.requester_email} -> {item.addressee_email} ({item.status})")

    print("\nSeeded groups:")
    for seed_group, group_id in zip(SEED_GROUPS, seeded_group_ids, strict=False):
        print(f"  {seed_group.name} ({group_id})")

    print("\nSeeded crown activity:")
    print("  guest: 2 qualifying captures")
    print("  lena: 3 qualifying captures")
    print("  marco: 1 qualifying capture")
    print("  nina: 2 qualifying captures")
    print("  sam: 1 qualifying capture")


if __name__ == "__main__":
    seed()
