import { apiDelete, apiGet, apiPostJson, apiRequest, setBackendAccessToken } from '@/services/backendApi';
import { Platform } from 'react-native';

export interface RemoteUserProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  city: string;
  email: string;
  avatarUri: string;
  role: string;
}

export interface RemoteAuthSession {
  accessToken: string;
  user: RemoteUserProfile;
}

export interface RegisterRemoteUserInput {
  username: string;
  fullName: string;
  bio: string;
  city: string;
  email: string;
  password: string;
  avatarUri?: string;
}

export interface UpdateRemoteUserInput {
  username?: string;
  fullName?: string;
  bio?: string;
  city?: string;
  email?: string;
  avatarUri?: string;
}

export interface PasswordResetChallenge {
  challengeId: string | null;
  debugCode: string | null;
  message: string;
}

interface ApiAuthUser {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  city: string;
  email: string;
  avatar_uri: string;
  role: string;
}

interface ApiAuthSession {
  access_token: string;
  token_type: string;
  user: ApiAuthUser;
}

interface ApiPasswordResetChallenge {
  ok: boolean;
  challenge_id: string | null;
  debug_code: string | null;
  message: string;
}

function mapApiUser(user: ApiAuthUser): RemoteUserProfile {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    bio: user.bio,
    city: user.city,
    email: user.email,
    avatarUri: user.avatar_uri,
    role: user.role,
  };
}

function mapApiSession(session: ApiAuthSession): RemoteAuthSession {
  return {
    accessToken: session.access_token,
    user: mapApiUser(session.user),
  };
}

function isRemoteUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

async function appendOptionalImageFile(
  formData: FormData,
  fieldName: string,
  imageUri?: string
): Promise<void> {
  if (!imageUri?.trim()) {
    return;
  }

  const trimmedUri = imageUri.trim();
  if (isRemoteUri(trimmedUri)) {
    formData.append('avatar_uri', trimmedUri);
    return;
  }

  if (Platform.OS === 'web') {
    const response = await fetch(trimmedUri);
    const blob = await response.blob();
    formData.append(fieldName, blob, 'avatar.jpg');
    return;
  }

  formData.append(
    fieldName,
    {
      uri: trimmedUri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as unknown as Blob
  );
}

async function buildUserFormData(
  payload: RegisterRemoteUserInput | UpdateRemoteUserInput,
  includePassword: boolean
): Promise<FormData> {
  const formData = new FormData();

  if ('username' in payload && typeof payload.username === 'string') {
    formData.append('username', payload.username);
  }
  if ('fullName' in payload && typeof payload.fullName === 'string') {
    formData.append('full_name', payload.fullName);
  }
  if ('bio' in payload && typeof payload.bio === 'string') {
    formData.append('bio', payload.bio);
  }
  if ('city' in payload && typeof payload.city === 'string') {
    formData.append('city', payload.city);
  }
  if ('email' in payload && typeof payload.email === 'string') {
    formData.append('email', payload.email);
  }
  if (includePassword && 'password' in payload && typeof payload.password === 'string') {
    formData.append('password', payload.password);
  }

  await appendOptionalImageFile(formData, 'avatar_file', payload.avatarUri);
  return formData;
}

export async function signInRemoteUser(email: string, password: string): Promise<RemoteAuthSession> {
  const payload = await apiPostJson<ApiAuthSession>('/api/auth/login', { email, password });
  return mapApiSession(payload);
}

export async function registerRemoteUser(payload: RegisterRemoteUserInput): Promise<RemoteAuthSession> {
  const body = await buildUserFormData(payload, true);
  const session = await apiRequest<ApiAuthSession>('/api/auth/register', {
    method: 'POST',
    body,
  });
  return mapApiSession(session);
}

export async function fetchRemoteCurrentUser(): Promise<RemoteUserProfile> {
  const payload = await apiGet<ApiAuthUser>('/api/auth/me');
  return mapApiUser(payload);
}

export async function updateRemoteCurrentUser(payload: UpdateRemoteUserInput): Promise<RemoteUserProfile> {
  const body = await buildUserFormData(payload, false);
  const response = await apiRequest<ApiAuthUser>('/api/users/me', {
    method: 'PUT',
    body,
  });
  return mapApiUser(response);
}

export async function changeRemotePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiPostJson('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function requestRemotePasswordReset(email: string): Promise<PasswordResetChallenge> {
  const response = await apiPostJson<ApiPasswordResetChallenge>('/api/auth/password-reset/request', { email });
  return {
    challengeId: response.challenge_id,
    debugCode: response.debug_code,
    message: response.message,
  };
}

export async function confirmRemotePasswordReset(
  challengeId: string,
  code: string,
  newPassword: string
): Promise<void> {
  await apiPostJson('/api/auth/password-reset/confirm', {
    challenge_id: challengeId,
    code,
    new_password: newPassword,
  });
}

export async function deleteRemoteCurrentUser(): Promise<void> {
  await apiDelete('/api/users/me');
  setBackendAccessToken(null);
}
