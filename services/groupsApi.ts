import { apiDelete, apiGet, apiPatchJson, apiPostJson } from '@/services/backendApi';
import type { FriendUser } from '@/services/friendsApi';

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  visibility: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  membership_role: string;
  membership_status: string;
  member_count: number;
}

export interface GroupMember {
  id: string;
  user: FriendUser;
  role: 'owner' | 'admin' | 'member';
  status: 'invited' | 'accepted' | 'declined' | 'removed';
  invited_by_user_id?: string | null;
  joined_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupDetail extends GroupSummary {
  current_user_role: string;
  current_user_status: string;
  members: GroupMember[];
}

export interface GroupListResponse {
  items: GroupSummary[];
  pending_invites: GroupSummary[];
}

export interface GroupLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string;
  crown_count: number;
  period_crowns: number;
  is_current_user: boolean;
}

export interface GroupLeaderboardResponse {
  group_id: string;
  period: 'all_time' | 'weekly' | 'monthly';
  generated_at: string;
  entries: GroupLeaderboardEntry[];
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  invited_user_ids?: string[];
}

export async function getGroups(): Promise<GroupListResponse> {
  return apiGet<GroupListResponse>('/api/groups');
}

export async function createGroup(payload: CreateGroupPayload): Promise<GroupDetail> {
  return apiPostJson<GroupDetail>('/api/groups', payload);
}

export async function getGroup(groupId: string): Promise<GroupDetail> {
  return apiGet<GroupDetail>(`/api/groups/${groupId}`);
}

export async function updateGroup(groupId: string, payload: { name?: string; description?: string }): Promise<GroupDetail> {
  return apiPatchJson<GroupDetail>(`/api/groups/${groupId}`, payload);
}

export async function deleteOrArchiveGroup(groupId: string): Promise<void> {
  await apiDelete(`/api/groups/${groupId}`);
}

export async function inviteGroupMembers(groupId: string, userIds: string[]): Promise<GroupDetail> {
  return apiPostJson<GroupDetail>(`/api/groups/${groupId}/invitations`, { user_ids: userIds });
}

export async function acceptGroupInvite(groupId: string): Promise<GroupDetail> {
  return apiPostJson<GroupDetail>(`/api/groups/${groupId}/invitations/accept`, {});
}

export async function declineGroupInvite(groupId: string): Promise<void> {
  await apiPostJson(`/api/groups/${groupId}/invitations/decline`, {});
}

export async function leaveGroup(groupId: string, currentUserId: string): Promise<void> {
  await apiDelete(`/api/groups/${groupId}/members/${currentUserId}`);
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await apiDelete(`/api/groups/${groupId}/members/${userId}`);
}

export async function updateGroupMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<GroupDetail> {
  return apiPatchJson<GroupDetail>(`/api/groups/${groupId}/members/${userId}`, { role });
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  return apiGet<GroupMember[]>(`/api/groups/${groupId}/members`);
}

export async function getGroupLeaderboard(
  groupId: string,
  period: 'all_time' | 'weekly' | 'monthly' = 'all_time'
): Promise<GroupLeaderboardResponse> {
  return apiGet<GroupLeaderboardResponse>(`/api/groups/${groupId}/leaderboard?period=${period}`);
}
