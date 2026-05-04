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
  {
    id: 'park-food-beats',
    title: 'Park Food & Beats',
    shortTitle: 'Day-to-night food session',
    date: '20 Sep',
    fullDate: 'Sunday 20 September 2026',
    time: '16:00 - 23:30',
    place: 'Bois de la Cambre',
    address: 'South Lawn, Bois de la Cambre',
    attendees: '176 going',
    attendeeCount: 176,
    price: '9 EUR',
    priceLabel: '9 EUR entrance',
    vibe: 'Street food, house, sunset',
    experience: 'Outdoor food market',
    heroImage:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Sunday Social Club',
    hostAvatar: 'https://i.pravatar.cc/120?img=44',
    badge: 'FOOD FAVORITE',
    description:
      'A relaxed open-air evening with quality food stalls, warm house sets and a crowd easing from daylight into a lively night.',
    tags: ['Food', 'Outdoor', 'Sunset', 'House'],
  },
  {
    id: 'gallery-neon-nights',
    title: 'Gallery Neon Nights',
    date: '03 Oct',
    fullDate: 'Saturday 3 October 2026',
    time: '19:30 - 01:30',
    place: 'Marolles',
    address: 'Atelier 17, Marolles',
    attendees: '84 going',
    attendeeCount: 84,
    price: '22 EUR',
    priceLabel: '22 EUR entry',
    vibe: 'Art, cocktails, electronic',
    experience: 'Indoor pop-up',
    heroImage:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Neon Frame',
    hostAvatar: 'https://i.pravatar.cc/120?img=47',
    badge: 'ART & NIGHTLIFE',
    description:
      'A stylish crossover between gallery opening and club night, with immersive visuals, cocktails and a more dressed-up crowd.',
    tags: ['Electronic', 'Indoor', 'Art', 'Cocktails'],
  },
  {
    id: 'brewery-yard-jam',
    title: 'Brewery Yard Jam',
    date: '11 Oct',
    fullDate: 'Sunday 11 October 2026',
    time: '15:00 - 22:30',
    place: 'Anderlecht',
    address: 'Old Brewery Yard, Anderlecht',
    attendees: '149 going',
    attendeeCount: 149,
    price: 'Free',
    priceLabel: 'Free entry before 18:00',
    vibe: 'Local bands, yard beers',
    experience: 'Community live session',
    heroImage:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Yard Sessions',
    hostAvatar: 'https://i.pravatar.cc/120?img=27',
    badge: 'FREE ENTRY',
    description:
      'A casual brewery courtyard gathering with local bands, accessible prices and the kind of crowd that actually stays for the whole set.',
    tags: ['Live music', 'Craft beer', 'Outdoor', 'Community'],
  },
  {
    id: 'dawn-runners-afterparty',
    title: 'Dawn Runners Afterparty',
    date: '25 Oct',
    fullDate: 'Sunday 25 October 2026',
    time: '06:30 - 11:30',
    place: 'European Quarter',
    address: 'Glass Pavilion, European Quarter',
    attendees: '58 going',
    attendeeCount: 58,
    price: '11 EUR',
    priceLabel: '11 EUR early pass',
    vibe: 'Morning electronic, coffee',
    experience: 'Sunrise session',
    heroImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    hostName: 'First Light Collective',
    hostAvatar: 'https://i.pravatar.cc/120?img=53',
    badge: 'SUNRISE PICK',
    description:
      'A softer morning event for people who want movement, coffee and electronic energy without waiting for midnight to feel something.',
    tags: ['Electronic', 'Coffee', 'Morning', 'Social'],
  },
  {
    id: 'jazz-and-wine-night',
    title: 'Jazz & Wine Night',
    shortTitle: 'Acoustic jazz evening',
    date: '05 Nov',
    fullDate: 'Thursday 5 November 2026',
    time: '19:00 - 23:00',
    place: 'Sablon',
    address: 'Grand Sablon Square, Brussels',
    attendees: '112 going',
    attendeeCount: 112,
    price: '20 EUR',
    priceLabel: '20 EUR entry + 1 wine',
    vibe: 'Jazz, acoustic, cozy',
    experience: 'Intimate concert',
    heroImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Sablon Arts',
    hostAvatar: 'https://i.pravatar.cc/120?img=41',
    badge: 'INTIMATE',
    description: 'An acoustic journey through contemporary jazz, perfectly paired with a curated selection of natural wines in an intimate setting.',
    tags: ['Jazz', 'Wine', 'Acoustic', 'Cozy'],
  },
  {
    id: 'underground-techno-bunker',
    title: 'Underground Bunker',
    shortTitle: 'Hard techno all night',
    date: '13 Nov',
    fullDate: 'Friday 13 November 2026',
    time: '23:30 - 07:00',
    place: 'Schaerbeek',
    address: 'Secret Location, Schaerbeek',
    attendees: '340 going',
    attendeeCount: 340,
    price: '15 EUR',
    priceLabel: '15 EUR early bird',
    vibe: 'Techno, dark, industrial',
    experience: 'Rave',
    heroImage: 'https://images.unsplash.com/photo-1558317714-a957d1887e58?auto=format&fit=crop&w=1400&q=80',
    hostName: 'Kollektiv Z',
    hostAvatar: 'https://i.pravatar.cc/120?img=55',
    badge: 'HARD TECHNO',
    description: 'No photos, no nonsense. Just pure, unadulterated industrial techno in a concrete bunker until the sun comes up.',
    tags: ['Techno', 'Rave', 'Underground', 'Dark'],
  },
];

export const FEATURED_EVENT_ID = 'canal-lights-open-air';

