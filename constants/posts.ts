export interface PostUser {
  id: string;
  username: string;
  avatarUri: string;
}

export interface PostComment {
  id: string;
  user: PostUser;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  user: PostUser;
  imageUri: string;
  date: string;
  isBeerFinished: boolean;
  eventId?: string;
  eventTitle?: string;
  likes: string[];
  comments: PostComment[];
}

export const MOCK_USERS = [
  { id: 'u1', username: 'alex', avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  { id: 'u2', username: 'sarah_night', avatarUri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80' },
];

export const POST_RECORDS: Post[] = [
  {
    id: 'seed-post-1',
    user: MOCK_USERS[0],
    imageUri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80',
    date: '18/07/2026',
    isBeerFinished: true,
    eventId: 'afterwork-tasting',
    eventTitle: 'Afterwork Tasting',
    likes: ['sarah_night', 'demo'],
    comments: [
      { id: 'c1', user: MOCK_USERS[1], text: 'Great vibe out there!', time: '2 hours ago' }
    ]
  },
  {
    id: 'seed-post-2',
    user: MOCK_USERS[1],
    imageUri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    date: '07/09/2026',
    isBeerFinished: false,
    eventId: 'canal-lights-open-air',
    eventTitle: 'Canal Lights Open Air',
    likes: ['alex'],
    comments: []
  },
  {
    id: 'seed-post-3',
    user: { id: 'u3', username: 'demo', avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    imageUri: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=900&q=80',
    date: '20/09/2026',
    isBeerFinished: true,
    eventId: 'park-food-beats',
    eventTitle: 'Park Food & Beats',
    likes: ['sarah_night'],
    comments: []
  },
  {
    id: 'seed-post-4',
    user: { id: 'u4', username: 'Lina', avatarUri: 'https://i.pravatar.cc/150?img=32' },
    imageUri: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=900&q=80',
    date: '25/09/2026',
    isBeerFinished: false,
    eventId: 'gallery-neon-nights',
    eventTitle: 'Gallery Neon Nights',
    likes: ['alex', 'Lina'],
    comments: []
  },
  {
    id: 'seed-post-5',
    user: { id: 'u5', username: 'Milan', avatarUri: 'https://i.pravatar.cc/150?img=11' },
    imageUri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    date: '20/09/2026',
    isBeerFinished: true,
    eventId: 'park-food-beats',
    eventTitle: 'Park Food & Beats',
    likes: ['demo', 'sarah_night', 'Milan'],
    comments: [
      { id: 'c2', user: MOCK_USERS[0], text: 'Amazing food there!', time: '1 day ago' }
    ]
  },
  {
    id: 'seed-post-6',
    user: MOCK_USERS[0],
    imageUri: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
    date: '11/10/2026',
    isBeerFinished: true,
    eventId: 'brewery-yard-jam',
    eventTitle: 'Brewery Yard Jam',
    likes: ['sarah_night'],
    comments: []
  },
];
