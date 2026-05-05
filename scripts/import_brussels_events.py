#!/usr/bin/env python3
"""Import Brussels events from Visit Brussels into EventCapture."""

from __future__ import annotations

import argparse
import html
import json
import re
import sqlite3
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from backend.database import create_user, get_user_by_email, init_database, upsert_event  # noqa: E402
from backend.config import DATABASE_PATH  # noqa: E402

VISIT_BRUSSELS_FEED_URL = (
    "https://www.visit.brussels/content/visitbrussels/en/visitors/agenda/"
    "all-events-wizard/jcr:content/root/container/agendafinder.feed.json"
)
DEFAULT_SKIPPED_CATEGORIES = (
    "Animations",
    "Cinema",
    "Conferences and conventions",
    "Courses and workshops",
    "Guided tours",
)
DEFAULT_PAGE_SIZE = 250
EXPLICIT_DRINK_KEYWORDS = (
    "after party",
    "afterwork",
    "apero",
    "aperitif",
    "beer",
    "brew",
    "brewery",
    "cocktail",
    "drink",
    "drinks",
    "happy hour",
    "natural wine",
    "pub",
    "spritz",
    "tasting",
    "wine",
)
STRONG_NIGHTLIFE_KEYWORDS = (
    "bar",
    "boiler club",
    "club night",
    "clubbing",
    "clubnight",
    "dj",
    "karaoke",
    "late jam",
    "late night",
    "party",
    "reggaeton",
    "rooftop",
    "sunset",
    "techno",
    "terrace",
)
SUPPORTING_NIGHTLIFE_KEYWORDS = (
    "dance",
    "electro",
    "electronic",
    "open air",
)
LOW_DRINKABILITY_KEYWORDS = (
    "cinema",
    "conference",
    "convention",
    "course",
    "courses and workshops",
    "exhibition",
    "family",
    "film",
    "games and quiz",
    "guided tour",
    "guided tours",
    "historical film",
    "kids",
    "lecture",
    "library",
    "litterature",
    "literature",
    "market",
    "markets",
    "museum",
    "screening",
    "sport",
    "streaming",
    "training",
    "workshop",
)
CATEGORY_PRIORITY = {
    "Concert": 0,
    "Show": 1,
    "Theatre": 2,
    "Various": 3,
}
BADGE_BY_CATEGORY = {
    "Animations": "ANIMATION",
    "Cinema": "CINEMA",
    "Concert": "CONCERT",
    "Conferences and conventions": "CONFERENCE",
    "Courses and workshops": "WORKSHOP",
    "Guided tours": "GUIDED TOUR",
    "Show": "SHOW",
    "Theatre": "THEATRE",
    "Various": "CITY PICK",
}
IMPORT_ACTOR_EMAIL = "visit-brussels-importer@eventcapture.app"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch Brussels events from the official Visit Brussels feed and map them to EventCapture records.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=3,
        help="How many events to keep after filtering and ranking. Use 0 to keep all matched events.",
    )
    parser.add_argument(
        "--date-from",
        default=date.today().isoformat(),
        help="Only keep events on or after this date (YYYY-MM-DD). Default: today.",
    )
    parser.add_argument(
        "--all-pages",
        action="store_true",
        help="Fetch every available page from the Visit Brussels feed.",
    )
    parser.add_argument(
        "--page-size",
        type=int,
        default=DEFAULT_PAGE_SIZE,
        help=f"Feed page size. Default: {DEFAULT_PAGE_SIZE}.",
    )
    parser.add_argument(
        "--include-all-categories",
        action="store_true",
        help="Keep all event categories instead of only app-friendly nightlife-style picks.",
    )
    parser.add_argument(
        "--skip-sold-out",
        action="store_true",
        help="Exclude sold-out events.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the mapped EventCapture payloads without writing to disk or SQLite.",
    )
    parser.add_argument(
        "--output",
        help="Optional path to write the mapped EventCapture payloads as JSON.",
    )
    parser.add_argument(
        "--seed-output",
        help="Optional path to write a generated TypeScript module for in-project seed events.",
    )
    parser.add_argument(
        "--no-db",
        action="store_true",
        help="Skip importing the mapped events into backend/eventcapture.db.",
    )
    parser.add_argument(
        "--prune-existing",
        action="store_true",
        help="Delete previously imported Visit Brussels rows from SQLite when they are missing from the current mapped set. Use this with full syncs.",
    )
    parser.add_argument(
        "--source-url",
        default=VISIT_BRUSSELS_FEED_URL,
        help="Override the Visit Brussels feed URL.",
    )
    return parser.parse_args()


def clean_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return html.unescape(" ".join(value.split())).strip()


def normalize_text(value: str) -> str:
    return "".join(
        character
        for character in unicodedata.normalize("NFD", html.unescape(value).strip().lower())
        if unicodedata.category(character) != "Mn"
    )


def contains_keyword(text: str, keyword: str) -> bool:
    normalized_keyword = re.escape(normalize_text(keyword))
    return re.search(rf"(^|[^a-z0-9]){normalized_keyword}([^a-z0-9]|$)", text) is not None


def count_keyword_hits(text: str, keywords: tuple[str, ...]) -> int:
    return sum(1 for keyword in keywords if contains_keyword(text, keyword))


def build_feed_url(base_url: str, *, page: int, page_size: int) -> str:
    parsed = urllib.parse.urlparse(base_url)
    query = dict(urllib.parse.parse_qsl(parsed.query, keep_blank_values=True))
    query["page"] = str(page)
    query["size"] = str(page_size)
    return urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(query)))


def fetch_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "EventCapture Brussels importer/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def fetch_feed_events(source_url: str, *, all_pages: bool, page_size: int) -> list[dict[str, Any]]:
    first_payload = fetch_json(build_feed_url(source_url, page=1, page_size=page_size))
    total_pages = int(first_payload.get("totalPages") or 1)
    data = first_payload.get("data")
    events = [item for item in data if isinstance(item, dict)] if isinstance(data, list) else []

    if not all_pages or total_pages <= 1:
        return events

    for page in range(2, total_pages + 1):
        payload = fetch_json(build_feed_url(source_url, page=page, page_size=page_size))
        page_data = payload.get("data")
        if not isinstance(page_data, list):
            continue
        events.extend(item for item in page_data if isinstance(item, dict))

    return events


def parse_iso_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_iso_time(value: str | None) -> str | None:
    if not value:
        return None

    try:
        return datetime.strptime(value, "%H:%M:%S").strftime("%H:%M")
    except ValueError:
        return None


def get_event_window(event: dict[str, Any]) -> tuple[date | None, date | None]:
    start_date = parse_iso_date(event.get("date_start"))
    end_date = parse_iso_date(event.get("date_end")) or start_date
    return start_date, end_date


def get_next_active_date(event: dict[str, Any], current_date: date) -> date | None:
    dates = event.get("dates")
    if isinstance(dates, list):
        upcoming_days: list[date] = []
        for item in dates:
            if not isinstance(item, dict) or item.get("is_canceled"):
                continue

            day = parse_iso_date(item.get("day"))
            if day is None or day < current_date:
                continue

            upcoming_days.append(day)

        if upcoming_days:
            return min(upcoming_days)

    start_date, end_date = get_event_window(event)
    if start_date is None:
        return None

    if end_date and start_date <= current_date <= end_date:
        return current_date

    return start_date


def get_translation(node: dict[str, Any] | None, lang: str = "en") -> dict[str, Any]:
    if not isinstance(node, dict):
        return {}

    translations = node.get("translations")
    if not isinstance(translations, dict):
        return {}

    exact = translations.get(lang)
    if isinstance(exact, dict):
        return exact

    for value in translations.values():
        if isinstance(value, dict):
            return value

    return {}


def get_category_name(event: dict[str, Any]) -> str:
    categories = event.get("categories")
    if not isinstance(categories, dict):
        return "Event"

    main_category = categories.get("main")
    if not isinstance(main_category, dict):
        return "Event"

    translations = main_category.get("translations")
    if not isinstance(translations, dict):
        return "Event"

    return clean_text(translations.get("en")) or "Event"


def get_other_categories(event: dict[str, Any]) -> list[str]:
    categories = event.get("categories")
    if not isinstance(categories, dict):
        return []

    other_categories = categories.get("others")
    if not isinstance(other_categories, dict):
        return []

    translations = other_categories.get("translations")
    if not isinstance(translations, dict):
        return []

    names = translations.get("en")
    if not isinstance(names, list):
        return []

    cleaned = [clean_text(name) for name in names]
    return [name for name in cleaned if name]


def get_place_translation(event: dict[str, Any]) -> dict[str, Any]:
    return get_translation(event.get("place"))


def build_event_time(event: dict[str, Any], current_date: date) -> str:
    dates = event.get("dates")
    if not isinstance(dates, list) or not dates:
        return "Time TBA"

    relevant_entries: list[dict[str, Any]] = []
    for item in dates:
        if not isinstance(item, dict) or item.get("is_canceled"):
            continue

        day = parse_iso_date(item.get("day"))
        if day is None or day < current_date:
            continue

        relevant_entries.append(item)

    if not relevant_entries:
        relevant_entries = [item for item in dates if isinstance(item, dict) and not item.get("is_canceled")]

    if not relevant_entries:
        return "Time TBA"

    first_day = relevant_entries[0].get("day")
    same_day_entries = [item for item in relevant_entries if item.get("day") == first_day]

    if len(same_day_entries) > 1:
        starts: list[str] = []
        for item in same_day_entries[:3]:
            start = parse_iso_time(item.get("start"))
            if start and start not in starts:
                starts.append(start)
        if starts:
            return " / ".join(starts)

    primary = relevant_entries[0]
    start = parse_iso_time(primary.get("start"))
    end = parse_iso_time(primary.get("end"))
    if start and end:
        return f"{start} - {end}"
    if start:
        return start

    return "Time TBA"


def format_short_date(value: date) -> str:
    return value.strftime("%d %b")


def format_full_date(start_date: date, end_date: date | None) -> str:
    if end_date and end_date != start_date:
        return f"{start_date.strftime('%A %d %B %Y')} - {end_date.strftime('%A %d %B %Y')}"
    return start_date.strftime("%A %d %B %Y")


def extract_price_labels(event: dict[str, Any]) -> tuple[str, str]:
    if event.get("is_soldout"):
        return "Sold out", "Sold out on Visit Brussels"

    if event.get("is_free"):
        return "Free", "Free entry"

    prices = event.get("prices")
    if not isinstance(prices, list):
        return "Ticketed", "Ticket info on Visit Brussels"

    numeric_values: list[float] = []
    for item in prices:
        if not isinstance(item, dict):
            continue
        value = item.get("value")
        if isinstance(value, (int, float)):
            numeric_values.append(float(value))

    positive_values = [value for value in numeric_values if value > 0]
    if not positive_values:
        return "Ticketed", "Ticket info on Visit Brussels"

    lowest = min(positive_values)
    rounded = int(lowest) if lowest.is_integer() else lowest
    return f"{rounded} EUR", f"From {rounded} EUR"


def find_hero_image(event: dict[str, Any]) -> str:
    first_image = clean_text(event.get("firstImagePath"))
    if first_image:
        return first_image

    media = event.get("media")
    if isinstance(media, list):
        for item in media:
            if not isinstance(item, dict) or item.get("type") != "photo":
                continue
            link = clean_text(item.get("link"))
            if link:
                return link

    return "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80"


def build_short_title(category_name: str) -> str:
    category_label = category_name.lower() if category_name else "city"
    return f"Official Brussels {category_label} pick"


def build_badge(event: dict[str, Any], category_name: str) -> str:
    if event.get("is_soldout"):
        return "SOLD OUT"
    if event.get("is_free"):
        return "FREE ENTRY"
    return BADGE_BY_CATEGORY.get(category_name, "VISIT BRUSSELS")


def build_description(
    title: str,
    category_name: str,
    other_categories: list[str],
    place_name: str,
    city_name: str,
    time_label: str,
) -> str:
    details = []
    if other_categories:
        details.append(", ".join(other_categories[:2]))
    if time_label and time_label != "Time TBA":
        details.append(time_label)

    detail_text = f" with {details[0]}" if details else ""
    if len(details) > 1:
        detail_text += f" at {details[1]}"

    return (
        f"Official Visit Brussels listing for {title}. "
        f"{category_name} at {place_name} in {city_name}{detail_text}."
    )


def build_tags(category_name: str, other_categories: list[str], city_name: str) -> list[str]:
    tag_candidates = [category_name, *other_categories[:2], city_name, "Visit Brussels"]
    tags: list[str] = []
    seen: set[str] = set()

    for tag in tag_candidates:
        cleaned = clean_text(tag)
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        tags.append(cleaned)

    return tags[:4]


def build_place_label(place_translation: dict[str, Any]) -> str:
    return clean_text(place_translation.get("address_city")) or "Brussels"


def build_address(place_translation: dict[str, Any]) -> str:
    pieces = [
        clean_text(place_translation.get("name")),
        clean_text(place_translation.get("address_line1")),
        clean_text(place_translation.get("address_city")),
    ]
    return ", ".join(piece for piece in pieces if piece) or "Brussels"


def build_host_name(event: dict[str, Any], place_translation: dict[str, Any]) -> str:
    organizer = get_translation(event.get("organizer"))
    organizer_name = clean_text(organizer.get("name"))
    if organizer_name:
        return organizer_name

    place_name = clean_text(place_translation.get("name"))
    if place_name:
        return place_name

    return "Visit Brussels"


def build_vibe(category_name: str, other_categories: list[str]) -> str:
    parts = [category_name, *other_categories[:2]]
    cleaned = [clean_text(part) for part in parts if clean_text(part)]
    return ", ".join(cleaned)[:80] or "Brussels event"


def build_experience(category_name: str) -> str:
    category_label = category_name.lower() if category_name else "event"
    return f"Official Brussels {category_label}"


def build_signal_text(event: dict[str, Any], current_date: date) -> str:
    translation = get_translation(event)
    place_translation = get_place_translation(event)
    category_name = get_category_name(event)
    other_categories = get_other_categories(event)
    title = clean_text(translation.get("name")) or "Brussels Event"
    place_name = clean_text(place_translation.get("name"))
    city_name = clean_text(place_translation.get("address_city"))
    price, price_label = extract_price_labels(event)

    return normalize_text(
        " ".join(
            [
                title,
                category_name,
                " ".join(other_categories),
                build_event_time(event, current_date),
                build_place_label(place_translation),
                build_address(place_translation),
                place_name,
                city_name,
                build_vibe(category_name, other_categories),
                build_experience(category_name),
                build_host_name(event, place_translation),
                build_badge(event, category_name),
                price,
                price_label,
                " ".join(build_tags(category_name, other_categories, city_name)),
            ]
        )
    )


def parse_start_hour(time_label: str) -> int | None:
    match = re.search(r"(\d{1,2}):(\d{2})", time_label)
    if not match:
        return None
    return int(match.group(1))


def get_drinkability_score(event: dict[str, Any], current_date: date) -> int:
    text = build_signal_text(event, current_date)
    explicit_drink_hits = count_keyword_hits(text, EXPLICIT_DRINK_KEYWORDS)
    strong_nightlife_hits = count_keyword_hits(text, STRONG_NIGHTLIFE_KEYWORDS)
    supporting_nightlife_hits = count_keyword_hits(text, SUPPORTING_NIGHTLIFE_KEYWORDS)
    low_drinkability_hits = count_keyword_hits(text, LOW_DRINKABILITY_KEYWORDS)
    start_hour = parse_start_hour(build_event_time(event, current_date))
    evening_bonus = 1 if start_hour is not None and start_hour >= 18 else 0

    return (
        explicit_drink_hits * 6
        + strong_nightlife_hits * 4
        + supporting_nightlife_hits * 2
        + evening_bonus
        - low_drinkability_hits * 6
    )


def is_drink_friendly_event(event: dict[str, Any], current_date: date) -> bool:
    text = build_signal_text(event, current_date)
    explicit_drink_hits = count_keyword_hits(text, EXPLICIT_DRINK_KEYWORDS)
    if explicit_drink_hits > 0:
        return True

    if count_keyword_hits(text, LOW_DRINKABILITY_KEYWORDS) > 0:
        return False

    strong_nightlife_hits = count_keyword_hits(text, STRONG_NIGHTLIFE_KEYWORDS)
    supporting_nightlife_hits = count_keyword_hits(text, SUPPORTING_NIGHTLIFE_KEYWORDS)
    start_hour = parse_start_hour(build_event_time(event, current_date))
    is_evening_event = start_hour is not None and start_hour >= 18

    return (
        strong_nightlife_hits >= 2
        or (strong_nightlife_hits >= 1 and supporting_nightlife_hits >= 1 and is_evening_event)
        or (strong_nightlife_hits >= 1 and is_evening_event and contains_keyword(text, "night"))
    )


def map_event_record(event: dict[str, Any], current_date: date) -> dict[str, Any]:
    translation = get_translation(event)
    place_translation = get_place_translation(event)
    category_name = get_category_name(event)
    other_categories = get_other_categories(event)

    title = clean_text(translation.get("name")) or "Brussels Event"
    event_id = clean_text(event.get("id")) or title.lower().replace(" ", "-")
    start_date = parse_iso_date(event.get("date_start")) or current_date
    end_date = parse_iso_date(event.get("date_end"))
    time_label = build_event_time(event, current_date)
    place_label = build_place_label(place_translation)
    address = build_address(place_translation)
    place_name = clean_text(place_translation.get("name")) or place_label
    city_name = clean_text(place_translation.get("address_city")) or "Brussels"
    price, price_label = extract_price_labels(event)

    return {
        "id": f"visit-brussels-{event_id}",
        "title": title,
        "shortTitle": build_short_title(category_name),
        "date": format_short_date(start_date),
        "fullDate": format_full_date(start_date, end_date),
        "time": time_label,
        "place": place_label,
        "address": address,
        "attendees": "Official listing",
        "attendeeCount": 0,
        "price": price,
        "priceLabel": price_label,
        "vibe": build_vibe(category_name, other_categories),
        "experience": build_experience(category_name),
        "heroImage": find_hero_image(event),
        "hostName": build_host_name(event, place_translation),
        "hostAvatar": f"https://i.pravatar.cc/120?u=visit-brussels-{event_id}",
        "badge": build_badge(event, category_name),
        "description": build_description(
            title,
            category_name,
            other_categories,
            place_name,
            city_name,
            time_label,
        ),
        "tags": build_tags(category_name, other_categories, city_name),
    }


def to_backend_event_payload(event: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": event["id"],
        "title": event["title"],
        "short_title": event.get("shortTitle"),
        "date": event["date"],
        "full_date": event["fullDate"],
        "time": event["time"],
        "place": event["place"],
        "address": event["address"],
        "attendees": event["attendees"],
        "attendee_count": event["attendeeCount"],
        "price": event["price"],
        "price_label": event["priceLabel"],
        "vibe": event["vibe"],
        "experience": event["experience"],
        "hero_image": event["heroImage"],
        "host_name": event["hostName"],
        "host_avatar": event["hostAvatar"],
        "badge": event["badge"],
        "description": event["description"],
        "tags": event["tags"],
    }


def is_candidate_event(
    event: dict[str, Any],
    current_date: date,
    *,
    include_all_categories: bool,
    skip_sold_out: bool,
) -> bool:
    if event.get("is_canceled") or event.get("is_online"):
        return False

    if skip_sold_out and event.get("is_soldout"):
        return False

    start_date, end_date = get_event_window(event)
    if start_date is None:
        return False

    if end_date and end_date < current_date:
        return False

    if include_all_categories:
        return True

    category_name = get_category_name(event)
    if category_name in DEFAULT_SKIPPED_CATEGORIES:
        return False

    return is_drink_friendly_event(event, current_date)


def ranking_key(event: dict[str, Any], current_date: date) -> tuple[Any, ...]:
    category_name = get_category_name(event)
    start_date, _ = get_event_window(event)
    activity_date = get_next_active_date(event, current_date) or date.max
    title = clean_text(get_translation(event).get("name"))
    sold_out_rank = 1 if event.get("is_soldout") else 0
    ongoing_rank = 1 if start_date and start_date < current_date else 0
    drinkability_rank = -get_drinkability_score(event, current_date)

    return (
        activity_date,
        drinkability_rank,
        ongoing_rank,
        CATEGORY_PRIORITY.get(category_name, 99),
        sold_out_rank,
        title.lower(),
    )


def select_events(
    raw_events: list[dict[str, Any]],
    current_date: date,
    *,
    limit: int,
    include_all_categories: bool,
    skip_sold_out: bool,
) -> list[dict[str, Any]]:
    deduped_by_id: dict[str, dict[str, Any]] = {}
    for event in raw_events:
        event_id = clean_text(event.get("id"))
        if event_id and event_id not in deduped_by_id:
            deduped_by_id[event_id] = event

    candidates = [
        event
        for event in deduped_by_id.values()
        if is_candidate_event(
            event,
            current_date,
            include_all_categories=include_all_categories,
            skip_sold_out=skip_sold_out,
        )
    ]
    candidates.sort(key=lambda event: ranking_key(event, current_date))

    if limit <= 0:
        return candidates

    return candidates[:limit]


def write_output_file(output_path: str, events: list[dict[str, Any]]) -> None:
    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(events, indent=2, ensure_ascii=False), encoding="utf-8")


def write_seed_typescript(output_path: str, events: list[dict[str, Any]], generated_on: date) -> None:
    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(events, indent=2, ensure_ascii=False)
    content = (
        f"// Auto-generated from the official Visit Brussels agenda feed on {generated_on.isoformat()}.\n"
        "// Do not edit manually. Re-run the Brussels importer script instead.\n\n"
        f"export const IMPORTED_BRUSSELS_EVENT_RECORDS = {payload};\n"
    )
    destination.write_text(content, encoding="utf-8")


def ensure_import_actor() -> dict[str, object]:
    existing = get_user_by_email(IMPORT_ACTOR_EMAIL)
    if existing is not None:
        return existing

    return create_user(
        email=IMPORT_ACTOR_EMAIL,
        username="visit.brussels",
        password="VisitBrusselsImport123!",
        full_name="Visit Brussels Importer",
        city="Brussels",
        bio="System actor for official Brussels nightlife imports.",
        avatar_uri="https://i.pravatar.cc/160?u=visit-brussels-importer",
        role="admin",
    )


def prune_backend_events(keep_ids: set[str]) -> int:
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        rows = connection.execute("SELECT id FROM events WHERE id LIKE 'visit-brussels-%'").fetchall()
        stale_ids = [str(row[0]) for row in rows if str(row[0]) not in keep_ids]
        if stale_ids:
            connection.executemany("DELETE FROM events WHERE id = ?", [(event_id,) for event_id in stale_ids])
            connection.commit()
        return len(stale_ids)
    finally:
        connection.close()


def write_stdout(value: str) -> None:
    sys.stdout.buffer.write(value.encode("utf-8"))
    sys.stdout.buffer.write(b"\n")


def main() -> int:
    args = parse_args()
    current_date = parse_iso_date(args.date_from)
    if current_date is None:
        print("Invalid --date-from value. Use YYYY-MM-DD.", file=sys.stderr)
        return 1

    raw_events = fetch_feed_events(
        args.source_url,
        all_pages=args.all_pages,
        page_size=max(args.page_size, 1),
    )
    selected_events = select_events(
        raw_events,
        current_date,
        limit=args.limit,
        include_all_categories=args.include_all_categories,
        skip_sold_out=args.skip_sold_out,
    )
    mapped_events = [map_event_record(event, current_date) for event in selected_events]

    if not mapped_events:
        print("No matching Brussels events were found.", file=sys.stderr)
        return 1

    if args.output:
        write_output_file(args.output, mapped_events)

    if args.seed_output:
        write_seed_typescript(args.seed_output, mapped_events, current_date)

    if args.dry_run:
        write_stdout(json.dumps(mapped_events, indent=2, ensure_ascii=False))
        return 0

    pruned_count = 0
    if not args.no_db:
        init_database()
        import_actor = ensure_import_actor()
        for event in mapped_events:
            upsert_event(to_backend_event_payload(event), import_actor)
        if args.prune_existing:
            pruned_count = prune_backend_events({event["id"] for event in mapped_events})

    action_bits = []
    if args.seed_output:
        action_bits.append("seed file")
    if not args.no_db:
        action_bits.append("SQLite")
    if args.output:
        action_bits.append("JSON output")

    action_label = ", ".join(action_bits) if action_bits else "selection"
    write_stdout(f"Processed {len(mapped_events)} Brussels event(s) for {action_label}.")
    if pruned_count:
        write_stdout(f"Pruned {pruned_count} stale Visit Brussels event(s) from SQLite.")
    for event in mapped_events[:10]:
        write_stdout(f"- {event['title']} ({event['fullDate']} - {event['time']})")
    if len(mapped_events) > 10:
        write_stdout(f"... and {len(mapped_events) - 10} more")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
