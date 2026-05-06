import { apiDelete, apiGet, apiPostJson } from '@/services/backendApi';

export interface FriendUser {
  id: string;
  username: string;
  full_name: string;
  avatar_uri: string;
  crown_count: number;
}

export interface UserSearchResult extends FriendUser {
  friendship_status: string;
}

export interface FriendRequestItem {
  id: string;
  status: string;
  direction: 'incoming' | 'outgoing';
  requester_user: FriendUser;
  addressee_user: FriendUser;
  created_at: string;
  updated_at: string;
  responded_at?: string | null;
}

export interface FriendRequestsResponse {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}

export interface FriendListItem {
  friendship_id: string;
  friend: FriendUser;
  created_at: string;
  updated_at: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  return apiGet<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
}

export async function getFriends(): Promise<FriendListItem[]> {
  return apiGet<FriendListItem[]>('/api/friends');
}

export async function getFriendRequests(): Promise<FriendRequestsResponse> {
  return apiGet<FriendRequestsResponse>('/api/friends/requests');
}

export async function sendFriendRequest(userId: string): Promise<FriendRequestItem> {
  return apiPostJson<FriendRequestItem>('/api/friends/requests', { user_id: userId });
}

export async function acceptFriendRequest(requestId: string): Promise<FriendRequestItem> {
  return apiPostJson<FriendRequestItem>(`/api/friends/requests/${requestId}/accept`, {});
}

export async function declineFriendRequest(requestId: string): Promise<FriendRequestItem> {
  return apiPostJson<FriendRequestItem>(`/api/friends/requests/${requestId}/decline`, {});
}

export async function removeFriend(userId: string): Promise<void> {
  await apiDelete(`/api/friends/${userId}`);
}
