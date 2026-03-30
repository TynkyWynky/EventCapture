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

export const EVENT_RECORDS: EventRecord[] = [
  {
    id: 'rooftop-session',
    title: 'Rooftop Session',
    shortTitle: 'Featured rooftop night',
    date: '18 Jul',
    fullDate: 'Friday 18 July 2026',
    time: '20:30 - 01:00',
    place: 'Ixelles',
    address: 'Belvedere Rooftop, Ixelles',
    attendees: '128 going',
    attendeeCount: 128,
    price: '18 EUR',
    priceLabel: '18 EUR pre-sale',
    vibe: 'Live set, rooftop',
    experience: 'Open air',
    heroImage:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Brussels Afterglow',
    hostAvatar: 'https://i.pravatar.cc/120?img=12',
    badge: 'TRENDING TONIGHT',
    description:
      'Sunset views, a warm crowd and a rooftop set that builds slowly into a high-energy night above the city skyline.',
    tags: ['Live music', 'Open air', 'Rooftop', 'Friends night'],
  },
  {
    id: 'midnight-vinyl-club',
    title: 'Midnight Vinyl Club',
    date: '24 Aug',
    fullDate: 'Monday 24 August 2026',
    time: '22:00 - 03:00',
    place: 'Saint-Gilles',
    address: 'Vinyl Room, Saint-Gilles',
    attendees: '92 going',
    attendeeCount: 92,
    price: '14 EUR',
    priceLabel: '14 EUR entry',
    vibe: 'Soul, disco, selectors',
    experience: 'Club night',
    heroImage:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Needle & Night',
    hostAvatar: 'https://i.pravatar.cc/120?img=22',
    badge: 'LATE SESSION',
    description:
      'A tighter indoor session with vinyl-only DJs, low lights and a crowd that comes for deep cuts instead of empty hype.',
    tags: ['Vinyl', 'Late night', 'Disco', 'Indoor'],
  },
  {
    id: 'canal-lights-open-air',
    title: 'Canal Lights Open Air',
    date: '07 Sep',
    fullDate: 'Monday 7 September 2026',
    time: '21:30 - 02:00',
    place: 'Molenbeek',
    address: 'Canal Stage, Molenbeek',
    attendees: '208 going',
    attendeeCount: 208,
    price: '16 EUR',
    priceLabel: '16 EUR online',
    vibe: 'Electronic, visuals',
    experience: 'Night open air',
    heroImage:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Canal Frequency',
    hostAvatar: 'https://i.pravatar.cc/120?img=31',
    badge: 'OPEN AIR PICK',
    description:
      'Electronic sets, riverside lights and a crowd that stays moving from the first build-up until the final drop.',
    tags: ['Electronic', 'Open air', 'Visuals', 'Canal side'],
  },
  {
    id: 'afterwork-tasting',
    title: 'Afterwork Tasting',
    date: '14 Sep',
    fullDate: 'Monday 14 September 2026',
    time: '18:30 - 23:00',
    place: 'Brussels Center',
    address: 'Hop Hall, Brussels Center',
    attendees: '63 going',
    attendeeCount: 63,
    price: '12 EUR',
    priceLabel: '12 EUR tasting pass',
    vibe: 'Craft beer, social',
    experience: 'Tasting night',
    heroImage:
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1400&q=80',
    hostName: 'City Pour Club',
    hostAvatar: 'https://i.pravatar.cc/120?img=18',
    badge: 'AFTERWORK',
    description:
      'A relaxed city tasting evening with local brewers, mellow music and enough room to actually talk over a good drink.',
    tags: ['Craft beer', 'Social', 'Afterwork', 'Tasting'],
  },
];

export const FEATURED_EVENT_ID = 'canal-lights-open-air';

export function getEventById(eventId?: string | string[]) {
  if (!eventId || Array.isArray(eventId)) {
    return undefined;
  }

  return EVENT_RECORDS.find((event) => event.id === eventId);
}
