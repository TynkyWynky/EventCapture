import type { EventRecord } from '@/constants/events';
import { apiDelete, apiGet, apiPostJson } from '@/services/backendApi';

interface ApiAppUser {
  id: string;
  username: string;
  avatar_uri: string;
}

interface ApiPostComment {
  id: string;
  user: ApiAppUser;
  text: string;
  time: string;
}

interface ApiPost {
  id: string | null;
  user?: ApiAppUser | null;
  image_uri: string;
  date: string;
  is_beer_finished: boolean;
  event_id?: string | null;
  event_title?: string | null;
  likes: string[];
  comments: ApiPostComment[];
  capture_id?: string | null;
}

interface ApiEvent {
  id?: string | null;
  title: string;
  short_title?: string | null;
  date: string;
  full_date: string;
  time: string;
  place: string;
  address: string;
  attendees: string;
  attendee_count: number;
  price: string;
  price_label: string;
  vibe: string;
  experience: string;
  hero_image: string;
  host_name: string;
  host_avatar: string;
  badge: string;
  description: string;
  tags: string[];
  created_by_user_id?: string | null;
}

export interface RemotePostUser {
  id: string;
  username: string;
  avatarUri: string;
}

export interface RemotePostComment {
  id: string;
  user: RemotePostUser;
  text: string;
  time: string;
}

export interface RemotePostRecord {
  id?: string;
  user?: RemotePostUser;
  imageUri: string;
  date: string;
  isBeerFinished: boolean;
  eventId?: string;
  eventTitle?: string;
  likes: string[];
  comments: RemotePostComment[];
  captureId?: string;
}

function mapApiEventToEventRecord(event: ApiEvent): EventRecord {
  return {
    id: String(event.id ?? ''),
    title: event.title,
    shortTitle: event.short_title ?? undefined,
    date: event.date,
    fullDate: event.full_date,
    time: event.time,
    place: event.place,
    address: event.address,
    attendees: event.attendees,
    attendeeCount: event.attendee_count,
    price: event.price,
    priceLabel: event.price_label,
    vibe: event.vibe,
    experience: event.experience,
    heroImage: event.hero_image,
    hostName: event.host_name,
    hostAvatar: event.host_avatar,
    badge: event.badge,
    description: event.description,
    tags: Array.isArray(event.tags) ? event.tags.filter(Boolean) : [],
  };
}

function mapEventRecordToApiEvent(event: EventRecord): ApiEvent {
  return {
    id: event.id,
    title: event.title,
    short_title: event.shortTitle ?? null,
    date: event.date,
    full_date: event.fullDate,
    time: event.time,
    place: event.place,
    address: event.address,
    attendees: event.attendees,
    attendee_count: event.attendeeCount,
    price: event.price,
    price_label: event.priceLabel,
    vibe: event.vibe,
    experience: event.experience,
    hero_image: event.heroImage,
    host_name: event.hostName,
    host_avatar: event.hostAvatar,
    badge: event.badge,
    description: event.description,
    tags: event.tags,
  };
}

function mapApiPostToRemotePost(post: ApiPost): RemotePostRecord {
  return {
    id: post.id ?? undefined,
    user: post.user
      ? {
          id: post.user.id,
          username: post.user.username,
          avatarUri: post.user.avatar_uri,
        }
      : undefined,
    imageUri: post.image_uri,
    date: post.date,
    isBeerFinished: post.is_beer_finished,
    eventId: post.event_id ?? undefined,
    eventTitle: post.event_title ?? undefined,
    likes: Array.isArray(post.likes) ? post.likes.filter(Boolean) : [],
    comments: Array.isArray(post.comments)
      ? post.comments.map((comment) => ({
          id: comment.id,
          user: {
            id: comment.user.id,
            username: comment.user.username,
            avatarUri: comment.user.avatar_uri,
          },
          text: comment.text,
          time: comment.time,
        }))
      : [],
    captureId: post.capture_id ?? undefined,
  };
}

function mapRemotePostToApiPost(post: RemotePostRecord): ApiPost {
  return {
    id: post.id ?? null,
    image_uri: post.imageUri,
    date: post.date,
    is_beer_finished: post.isBeerFinished,
    event_id: post.eventId ?? null,
    event_title: post.eventTitle ?? null,
    likes: post.likes,
    comments: [],
    capture_id: post.captureId ?? null,
  };
}

export async function fetchRemoteEvents(): Promise<EventRecord[]> {
  const payload = await apiGet<ApiEvent[]>('/api/events', false);
  return Array.isArray(payload) ? payload.map(mapApiEventToEventRecord) : [];
}

export async function upsertRemoteEvent(event: EventRecord): Promise<EventRecord> {
  const payload = await apiPostJson<ApiEvent>('/api/events', mapEventRecordToApiEvent(event));
  return mapApiEventToEventRecord(payload);
}

export async function deleteRemoteEvent(eventId: string): Promise<void> {
  await apiDelete(`/api/events/${eventId}`);
}

export async function fetchRemotePosts(): Promise<RemotePostRecord[]> {
  const payload = await apiGet<ApiPost[]>('/api/posts', false);
  return Array.isArray(payload) ? payload.map(mapApiPostToRemotePost) : [];
}

export async function upsertRemotePost(post: RemotePostRecord): Promise<RemotePostRecord> {
  const payload = await apiPostJson<ApiPost>('/api/posts', mapRemotePostToApiPost(post));
  return mapApiPostToRemotePost(payload);
}

export async function toggleRemotePostLike(postId: string): Promise<RemotePostRecord> {
  const payload = await apiPostJson<ApiPost>(`/api/posts/${postId}/likes/toggle`, {});
  return mapApiPostToRemotePost(payload);
}

export async function addRemotePostComment(postId: string, text: string): Promise<RemotePostRecord> {
  const payload = await apiPostJson<ApiPost>(`/api/posts/${postId}/comments`, { text });
  return mapApiPostToRemotePost(payload);
}

export async function deleteRemotePost(postId: string): Promise<void> {
  await apiDelete(`/api/posts/${postId}`);
}
