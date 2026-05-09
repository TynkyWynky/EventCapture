import { apiGet } from '@/services/backendApi';

export interface PublicProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_uri: string;
  bio: string;
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
  return apiGet<PublicProfile>(`/api/users/${encodeURIComponent(userId)}/public`);
}
