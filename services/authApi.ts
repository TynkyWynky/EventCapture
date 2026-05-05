import { apiDelete, apiGet, apiPostJson } from '@/services/backendApi';

export interface ApiUserProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  city: string;
  email: string;
  avatar_uri: string;
  role: string;
  crown_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  user: ApiUserProfile;
}

export interface RegisterPayload {
  username: string;
  full_name: string;
  email: string;
  password: string;
  city: string;
  bio: string;
  avatar_uri: string;
}

export interface UpdateProfilePayload {
  username: string;
  full_name: string;
  city: string;
  bio: string;
  avatar_uri: string;
  email: string;
}

export async function registerAccount(payload: RegisterPayload): Promise<AuthResponse> {
  return apiPostJson<AuthResponse>('/api/auth/register', payload, 'POST', false);
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  return apiPostJson<AuthResponse>('/api/auth/login', { email, password }, 'POST', false);
}

export async function logoutAccount(): Promise<void> {
  await apiPostJson('/api/auth/logout', {});
}

export async function deleteAccount(): Promise<void> {
  await apiDelete('/api/auth/account');
}

export async function fetchCurrentUser(): Promise<ApiUserProfile> {
  return apiGet<ApiUserProfile>('/api/auth/me');
}

export async function updateAccountProfile(payload: UpdateProfilePayload): Promise<ApiUserProfile> {
  return apiPostJson<ApiUserProfile>('/api/auth/profile', payload, 'PUT');
}

export async function changeAccountPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPostJson('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export interface PasswordResetRequestResponse {
  message: string;
  reset_token?: string | null;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
  return apiPostJson<PasswordResetRequestResponse>('/api/auth/reset-password/request', {
    email,
  }, 'POST', false);
}

export async function resetAccountPassword(token: string, newPassword: string): Promise<void> {
  await apiPostJson('/api/auth/reset-password/confirm', {
    token,
    new_password: newPassword,
  }, 'POST', false);
}

export async function listRemoteUsers(): Promise<ApiUserProfile[]> {
  return apiGet<ApiUserProfile[]>('/api/users');
}

export async function deleteRemoteUser(userId: string): Promise<void> {
  await apiDelete(`/api/users/${userId}`);
}
