import { apiDelete, apiGet, apiPostFormData, apiPostJson, apiPutFormData } from '@/services/backendApi';
import { Platform } from 'react-native';

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
  user: ApiUserProfile;
}

interface ApiAuthSessionResponse {
  access_token: string;
  token_type: string;
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

function mapAuthResponse(response: ApiAuthSessionResponse): AuthResponse {
  return {
    token: response.access_token,
    user: response.user,
  };
}

function buildAuthFormData(payload: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    formData.append(key, value);
  }
  return formData;
}

function isRemoteAvatarUri(value: string | undefined | null): boolean {
  if (!value) {
    return false;
  }

  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:');
}

function isLocalAvatarUri(value: string | undefined | null): boolean {
  return Boolean(value && !isRemoteAvatarUri(value));
}

function inferAvatarFileName(uri: string, fallbackExtension = '.jpg'): string {
  const sanitized = uri.split('?')[0]?.split('#')[0] ?? '';
  const candidate = sanitized.split('/').pop()?.trim();
  if (candidate && candidate.includes('.')) {
    return candidate;
  }
  return `avatar${fallbackExtension}`;
}

function inferAvatarMimeType(fileName: string): string {
  const lowered = fileName.toLowerCase();
  if (lowered.endsWith('.png')) {
    return 'image/png';
  }
  if (lowered.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

async function appendAvatarToFormData(formData: FormData, avatarUri: string) {
  if (!avatarUri.trim()) {
    return;
  }

  if (isRemoteAvatarUri(avatarUri)) {
    formData.append('avatar_uri', avatarUri.trim());
    return;
  }

  if (Platform.OS === 'web') {
    const response = await fetch(avatarUri);
    const blob = await response.blob();
    const fallbackExtension = blob.type === 'image/png' ? '.png' : blob.type === 'image/webp' ? '.webp' : '.jpg';
    const fileName = inferAvatarFileName(avatarUri, fallbackExtension);
    const file = new File([blob], fileName, { type: blob.type || inferAvatarMimeType(fileName) });
    formData.append('avatar_file', file);
    return;
  }

  const fileName = inferAvatarFileName(avatarUri);
  formData.append('avatar_file', {
    uri: avatarUri,
    name: fileName,
    type: inferAvatarMimeType(fileName),
  } as unknown as Blob);
}

export async function registerAccount(payload: RegisterPayload): Promise<AuthResponse> {
  let response: ApiAuthSessionResponse;
  if (isLocalAvatarUri(payload.avatar_uri)) {
    const formData = buildAuthFormData({
      username: payload.username,
      full_name: payload.full_name,
      email: payload.email,
      password: payload.password,
      city: payload.city,
      bio: payload.bio,
    });
    await appendAvatarToFormData(formData, payload.avatar_uri);
    response = await apiPostFormData<ApiAuthSessionResponse>('/api/auth/register', formData, false);
  } else {
    response = await apiPostJson<ApiAuthSessionResponse>('/api/auth/register', {
      username: payload.username,
      full_name: payload.full_name,
      email: payload.email,
      password: payload.password,
      city: payload.city,
      bio: payload.bio,
      avatar_uri: payload.avatar_uri,
    }, 'POST', false);
  }
  return mapAuthResponse(response);
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  const response = await apiPostJson<ApiAuthSessionResponse>('/api/auth/login', { email, password }, 'POST', false);
  return mapAuthResponse(response);
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
  if (isLocalAvatarUri(payload.avatar_uri)) {
    const formData = buildAuthFormData({
      username: payload.username,
      full_name: payload.full_name,
      city: payload.city,
      bio: payload.bio,
      email: payload.email,
    });
    await appendAvatarToFormData(formData, payload.avatar_uri);
    return apiPutFormData<ApiUserProfile>('/api/users/me', formData);
  }

  return apiPostJson<ApiUserProfile>('/api/users/me', {
    username: payload.username,
    full_name: payload.full_name,
    city: payload.city,
    bio: payload.bio,
    avatar_uri: payload.avatar_uri,
    email: payload.email,
  }, 'PUT');
}

export async function changeAccountPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPostJson('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export interface PasswordResetRequestResponse {
  message: string;
  challenge_id?: string | null;
  debug_code?: string | null;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
  return apiPostJson<PasswordResetRequestResponse>('/api/auth/password-reset/request', {
    email,
  }, 'POST', false);
}

export async function resetAccountPassword(token: string, newPassword: string): Promise<void> {
  const [challengeId, code] = token.split(':', 2).map((value) => value.trim());
  if (!challengeId || !code) {
    throw new Error('Use the reset code from this app. It should look like challenge-id:code.');
  }

  await apiPostJson('/api/auth/password-reset/confirm', {
    challenge_id: challengeId,
    code,
    new_password: newPassword,
  }, 'POST', false);
}

export async function listRemoteUsers(): Promise<ApiUserProfile[]> {
  return apiGet<ApiUserProfile[]>('/api/users');
}

export async function deleteRemoteUser(userId: string): Promise<void> {
  await apiDelete(`/api/users/${userId}`);
}
