import { apiGet, apiPostJson } from '@/services/backendApi';

export interface SocialUser {
  id: string;
  name: string;
  avatarUri: string;
}

export interface EventComment {
  id: string;
  user: string;
  userId: string;
  avatarUri: string;
  text: string;
  time: string;
}

export type EventPlanStatus = 'going' | 'maybe' | 'skip' | null;

export interface EventSocialState {
  liked: boolean;
  saved: boolean;
  likes: SocialUser[];
  comments: EventComment[];
  planStatus: EventPlanStatus;
  planNote: string;
}

interface ApiAppUser {
  id: string;
  username: string;
  avatar_uri: string;
}

interface ApiEventComment {
  id: string;
  user: ApiAppUser;
  text: string;
  time: string;
}

interface ApiEventSocialState {
  liked: boolean;
  saved: boolean;
  likes: ApiAppUser[];
  comments: ApiEventComment[];
  plan_status: EventPlanStatus;
  plan_note: string;
}

interface ApiEventSocialMap {
  items: Record<string, ApiEventSocialState>;
}

interface ApiPlanListResponse {
  items: {
    event_id: string;
    saved: boolean;
    plan_status: EventPlanStatus;
    plan_note: string;
  }[];
}

function mapSocialState(state: ApiEventSocialState): EventSocialState {
  return {
    liked: state.liked,
    saved: state.saved,
    likes: Array.isArray(state.likes)
      ? state.likes.map((user) => ({
          id: user.id,
          name: user.username,
          avatarUri: user.avatar_uri,
        }))
      : [],
    comments: Array.isArray(state.comments)
      ? state.comments.map((comment) => ({
          id: comment.id,
          user: comment.user.username,
          userId: comment.user.id,
          avatarUri: comment.user.avatar_uri,
          text: comment.text,
          time: comment.time,
        }))
      : [],
    planStatus: state.plan_status ?? null,
    planNote: state.plan_note ?? '',
  };
}

export async function fetchEventSocialMap(): Promise<Record<string, EventSocialState>> {
  const payload = await apiGet<ApiEventSocialMap>('/api/events/social');
  return Object.fromEntries(
    Object.entries(payload.items ?? {}).map(([eventId, state]) => [eventId, mapSocialState(state)])
  );
}

export async function toggleEventLikeRemote(eventId: string): Promise<EventSocialState> {
  const payload = await apiPostJson<ApiEventSocialState>(`/api/events/${eventId}/likes/toggle`, {});
  return mapSocialState(payload);
}

export async function toggleEventSaveRemote(eventId: string): Promise<EventSocialState> {
  const payload = await apiPostJson<ApiEventSocialState>(`/api/events/${eventId}/save-toggle`, {});
  return mapSocialState(payload);
}

export async function setEventPlanStatusRemote(eventId: string, status: EventPlanStatus): Promise<EventSocialState> {
  const payload = await apiPostJson<ApiEventSocialState>(`/api/events/${eventId}/plan`, {
    status,
  });
  return mapSocialState(payload);
}

export async function setEventPlanNoteRemote(eventId: string, note: string): Promise<EventSocialState> {
  const payload = await apiPostJson<ApiEventSocialState>(`/api/events/${eventId}/plan-note`, {
    note,
  });
  return mapSocialState(payload);
}

export async function addEventCommentRemote(eventId: string, text: string): Promise<EventSocialState> {
  const payload = await apiPostJson<ApiEventSocialState>(`/api/events/${eventId}/comments`, {
    text,
  });
  return mapSocialState(payload);
}

export async function fetchPlannedEventsRemote(): Promise<ApiPlanListResponse['items']> {
  const payload = await apiGet<ApiPlanListResponse>('/api/events/plans');
  return Array.isArray(payload.items) ? payload.items : [];
}
