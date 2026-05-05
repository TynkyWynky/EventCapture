"""Development seed data for EventCapture."""

from __future__ import annotations

from dataclasses import dataclass

try:
    from .database import create_user, get_user_by_email, init_database, list_posts, upsert_event, upsert_post
except ImportError:
    from database import create_user, get_user_by_email, init_database, list_posts, upsert_event, upsert_post


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
]


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


def seed() -> None:
    init_database()
    ensure_user(SEED_USERS[0])
    organizer = ensure_user(SEED_USERS[1])
    guest = ensure_user(SEED_USERS[2])

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

    upsert_event(
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

    if not list_posts():
        upsert_post(
            {
                "image_uri": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80",
                "date": "18/07/2026",
                "is_beer_finished": True,
                "event_id": rooftop["id"],
                "event_title": rooftop["title"],
            },
            guest,
        )

    print("Seeded users:")
    for item in SEED_USERS:
        print(f"  {item.email} / {item.password}")


if __name__ == "__main__":
    seed()
