import { apiGet, apiPostJson } from '@/services/backendApi';

export interface RemoteNotificationItem {
  id: string;
  actor_username: string;
  actor_avatar_uri: string;
  title: string;
  message: string;
  icon: string;
  color: string;
  related_type?: string | null;
  related_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface RemoteNotificationList {
  items: RemoteNotificationItem[];
  unread_count: number;
}

export interface ActivityNotificationPayload {
  title: string;
  message: string;
  icon: string;
  color: string;
  related_type?: string;
  related_id?: string;
}

export async function fetchNotifications(): Promise<RemoteNotificationList> {
  return apiGet<RemoteNotificationList>('/api/notifications');
}

export async function markNotificationsRead(): Promise<void> {
  await apiPostJson('/api/notifications/read-all', {});
}

export async function createActivityNotification(payload: ActivityNotificationPayload): Promise<RemoteNotificationItem> {
  return apiPostJson<RemoteNotificationItem>('/api/notifications/activity', payload);
}
