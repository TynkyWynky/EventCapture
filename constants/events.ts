import { IMPORTED_BRUSSELS_EVENT_RECORDS } from './generatedBrusselsEvents';

export interface EventRecord {
  id: string;
  title: string;
  shortTitle?: string;
  date: string;
  fullDate: string;
  time: string;
  place: string;
  address: string;
  attendees: string;
  attendeeCount: number;
  price: string;
  priceLabel: string;
  vibe: string;
  experience: string;
  heroImage: string;
  hostName: string;
  hostAvatar: string;
  badge: string;
  description: string;
  tags: string[];
}

export const REMOVED_SEED_EVENT_IDS = [
  'rooftop-session',
  'midnight-vinyl-club',
  'canal-lights-open-air',
  'afterwork-tasting',
  'park-food-beats',
  'gallery-neon-nights',
  'brewery-yard-jam',
  'dawn-runners-afterparty',
  'jazz-and-wine-night',
  'underground-techno-bunker',
] as const;

export const REMOVED_SEED_EVENT_TITLES = [
  'Rooftop Session',
  'Midnight Vinyl Club',
  'Canal Lights Open Air',
  'Afterwork Tasting',
  'Park Food & Beats',
  'Gallery Neon Nights',
  'Brewery Yard Jam',
  'Dawn Runners Afterparty',
  'Jazz & Wine Night',
  'Underground Bunker',
] as const;

const REMOVED_SEED_EVENT_ID_SET = new Set<string>(REMOVED_SEED_EVENT_IDS);
const TRUTHY_ENV_VALUES = new Set(['1', 'true', 'yes', 'on']);
const DRINK_KEYWORDS = [
  'afterwork',
  'beer',
  'brew',
  'brewery',
  'cocktail',
  'drink',
  'drinks',
  'happy hour',
  'natural wine',
  'pub',
  'spritz',
  'tasting',
  'wine',
] as const;
const NIGHTLIFE_KEYWORDS = [
  'bar',
  'cabaret',
  'club',
  'dance',
  'dj',
  'electronic',
  'festival',
  'house',
  'jazz',
  'karaoke',
  'late night',
  'live music',
  'music',
  'night',
  'party',
  'rooftop',
  'soir',
  'soiree',
  'sunset',
  'techno',
  'terrace',
] as const;
const PERFORMANCE_KEYWORDS = [
  'concert',
  'comedy',
  'gig',
  'live',
  'open air',
  'show',
  'theatre',
] as const;
const LOW_DRINKABILITY_KEYWORDS = [
  'cinema',
  'conference',
  'convention',
  'course',
  'exhibition',
  'family',
  'film',
  'guided tour',
  'kids',
  'lecture',
  'library',
  'museum',
  'screening',
  'training',
  'workshop',
] as const;

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseBooleanEnv(value: string | undefined): boolean {
  return value ? TRUTHY_ENV_VALUES.has(normalizeText(value)) : false;
}

function countKeywordHits(text: string, keywords: readonly string[]): number {
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
}

function parseStartHour(timeLabel: string): number | null {
  const match = timeLabel.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

function buildSearchableEventText(event: EventRecord): string {
  return normalizeText(
    [
      event.title,
      event.shortTitle ?? '',
      event.description,
      event.place,
      event.address,
      event.vibe,
      event.experience,
      event.hostName,
      event.badge,
      event.priceLabel,
      ...event.tags,
    ].join(' ')
  );
}

export const BRUSSELS_DRINKABLE_ONLY_ENABLED = parseBooleanEnv(
  process.env.EXPO_PUBLIC_BRUSSELS_DRINKABLE_ONLY
);

export function isRemovedSeedEventId(eventId?: string | null): boolean {
  return typeof eventId === 'string' && REMOVED_SEED_EVENT_ID_SET.has(eventId);
}

export function containsRemovedSeedEventTitle(value: string): boolean {
  const normalizedValue = normalizeText(value);
  return REMOVED_SEED_EVENT_TITLES.some((title) =>
    normalizedValue.includes(normalizeText(title))
  );
}

export function getEventDrinkabilityScore(event: EventRecord): number {
  const text = buildSearchableEventText(event);
  const drinkHits = countKeywordHits(text, DRINK_KEYWORDS);
  const nightlifeHits = countKeywordHits(text, NIGHTLIFE_KEYWORDS);
  const performanceHits = countKeywordHits(text, PERFORMANCE_KEYWORDS);
  const lowDrinkabilityHits = countKeywordHits(text, LOW_DRINKABILITY_KEYWORDS);
  const startHour = parseStartHour(event.time);
  const eveningBonus = startHour !== null && startHour >= 17 ? 1 : 0;
  const crowdBonus = event.attendeeCount >= 25 ? 1 : 0;

  return (
    drinkHits * 4 +
    nightlifeHits * 3 +
    performanceHits * 2 +
    eveningBonus +
    crowdBonus -
    lowDrinkabilityHits * 4
  );
}

export function isDrinkableEvent(event: EventRecord): boolean {
  return getEventDrinkabilityScore(event) >= 2;
}

export function filterEventRecordsForDiscovery(events: EventRecord[]): EventRecord[] {
  if (!BRUSSELS_DRINKABLE_ONLY_ENABLED) {
    return events;
  }

  return events.filter(isDrinkableEvent);
}

export const EVENT_RECORDS: EventRecord[] = [...IMPORTED_BRUSSELS_EVENT_RECORDS];

export function areEventRecordsEqual(left: EventRecord, right: EventRecord): boolean {
  return (
    left.id === right.id &&
    left.title === right.title &&
    left.shortTitle === right.shortTitle &&
    left.date === right.date &&
    left.fullDate === right.fullDate &&
    left.time === right.time &&
    left.place === right.place &&
    left.address === right.address &&
    left.attendees === right.attendees &&
    left.attendeeCount === right.attendeeCount &&
    left.price === right.price &&
    left.priceLabel === right.priceLabel &&
    left.vibe === right.vibe &&
    left.experience === right.experience &&
    left.heroImage === right.heroImage &&
    left.hostName === right.hostName &&
    left.hostAvatar === right.hostAvatar &&
    left.badge === right.badge &&
    left.description === right.description &&
    left.tags.length === right.tags.length &&
    left.tags.every((tag, index) => tag === right.tags[index])
  );
}

export function areEventCollectionsEqual(left: EventRecord[], right: EventRecord[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightById = new Map(right.map((event) => [event.id, event]));

  return left.every((event) => {
    const matchingEvent = rightById.get(event.id);
    return matchingEvent ? areEventRecordsEqual(event, matchingEvent) : false;
  });
}

export const FEATURED_EVENT_ID = EVENT_RECORDS[0]?.id ?? '';
