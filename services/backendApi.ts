import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

interface ExpoConstantsHostShape {
  linkingUri?: string | null;
  experienceUrl?: string | null;
  expoGoConfig?: {
    debuggerHost?: string | null;
    developer?: {
      tool?: string | null;
      projectRoot?: string | null;
    } | null;
  };
  expoConfig?: {
    hostUri?: string | null;
  };
  manifest2?: {
    extra?: {
      expoClient?: {
        hostUri?: string | null;
      };
    };
  };
  manifest?: {
    debuggerHost?: string | null;
  };
  platform?: {
    hostUri?: string | null;
  } | null;
}

const BACKEND_PORT = 8000;
const BACKEND_PROBE_TIMEOUT_MS = 2500;
const BACKEND_REQUEST_TIMEOUT_MS = 20000;

let cachedBackendApiBaseUrl: string | null = null;
let authTokenProvider: (() => string | null) | null = null;

function getPublicAppEnvironment(): string {
  return (process.env.EXPO_PUBLIC_APP_ENV?.trim() || process.env.NODE_ENV?.trim() || 'development').toLowerCase();
}

function isProductionLikeEnvironment(): boolean {
  return getPublicAppEnvironment() === 'production' || process.env.EAS_BUILD_PROFILE?.trim() === 'production';
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function extractHost(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const withoutProtocol = value.replace(/^[a-z]+:\/\//i, '');
  const [hostWithPort] = withoutProtocol.split('/');
  const [host] = hostWithPort.split(':');
  return host?.trim() || null;
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '::1' || host.startsWith('127.');
}

function isIpv4Host(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function isPrivateIpv4Host(host: string): boolean {
  if (!isIpv4Host(host)) {
    return false;
  }

  const [first, second] = host.split('.').map((segment) => Number(segment));
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function getHostPriority(host: string): number {
  if (host === '10.0.2.2') {
    return 5;
  }

  if (isPrivateIpv4Host(host)) {
    return 4;
  }

  if (isLoopbackHost(host)) {
    return 2;
  }

  return 1;
}

function getExpoHosts(): string[] {
  const constants = Constants as unknown as ExpoConstantsHostShape;
  const hosts = [
    extractHost(constants.expoGoConfig?.debuggerHost),
    extractHost(constants.manifest?.debuggerHost),
    extractHost(constants.manifest2?.extra?.expoClient?.hostUri),
    extractHost(constants.expoConfig?.hostUri),
    extractHost(constants.platform?.hostUri),
    extractHost(constants.linkingUri),
    extractHost(constants.experienceUrl),
    extractHost(Linking.getLinkingURL()),
  ].filter((host): host is string => Boolean(host));

  return Array.from(new Set(hosts)).sort(
    (left, right) => getHostPriority(right) - getHostPriority(left)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const messageCandidates = [payload.error, payload.detail, payload.message];
  for (const candidate of messageCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out. Check that the backend is reachable from your device.`);
    }

    throw new Error(`Unable to reach the backend at ${url}. Check your API URL and local network access.`);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function configureBackendApiAuth(getToken: () => string | null) {
  authTokenProvider = getToken;
}

export function getBackendApiAuthToken(): string | null {
  return authTokenProvider?.() ?? null;
}

export function clearCachedBackendApiBaseUrl() {
  cachedBackendApiBaseUrl = null;
}

export function getBackendApiBaseUrlCandidates(): string[] {
  const configuredUrl =
    process.env.EXPO_PUBLIC_BACKEND_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_DETECTION_API_URL?.trim();
  const candidates: string[] = [];
  const configuredHost = extractHost(configuredUrl);
  const shouldDeprioritizeConfiguredLoopback =
    Platform.OS !== 'web' && Boolean(configuredHost && isLoopbackHost(configuredHost));

  if (configuredUrl) {
    if (isProductionLikeEnvironment() && !configuredUrl.startsWith('https://')) {
      throw new Error('Production builds require EXPO_PUBLIC_BACKEND_API_URL to use HTTPS.');
    }
    if (!shouldDeprioritizeConfiguredLoopback) {
      candidates.push(trimTrailingSlash(configuredUrl));
    }
  } else if (isProductionLikeEnvironment()) {
    throw new Error('Production builds require EXPO_PUBLIC_BACKEND_API_URL to be set to an HTTPS backend URL.');
  }

  if (Platform.OS === 'web') {
    candidates.push(`http://localhost:${BACKEND_PORT}`);
    candidates.push(`http://127.0.0.1:${BACKEND_PORT}`);

    for (const host of getExpoHosts()) {
      if (host === 'localhost' || host.startsWith('127.')) {
        candidates.push(`http://${host}:${BACKEND_PORT}`);
      }
    }

    return Array.from(new Set(candidates.map(trimTrailingSlash)));
  }

  for (const host of getExpoHosts()) {
    candidates.push(`http://${host}:${BACKEND_PORT}`);
  }

  candidates.push(`http://10.0.2.2:${BACKEND_PORT}`);
  candidates.push(`http://127.0.0.1:${BACKEND_PORT}`);
  candidates.push(`http://localhost:${BACKEND_PORT}`);

  if (configuredUrl && shouldDeprioritizeConfiguredLoopback) {
    candidates.push(trimTrailingSlash(configuredUrl));
  }

  return Array.from(new Set(candidates.map(trimTrailingSlash)));
}

export function getBackendApiBaseUrl(): string {
  return cachedBackendApiBaseUrl ?? getBackendApiBaseUrlCandidates()[0];
}

export async function resolveBackendApiBaseUrl(): Promise<string> {
  const candidateBaseUrls = [
    ...(cachedBackendApiBaseUrl ? [cachedBackendApiBaseUrl] : []),
    ...getBackendApiBaseUrlCandidates().filter((baseUrl) => baseUrl !== cachedBackendApiBaseUrl),
  ];

  let lastProbeError: Error | null = null;

  for (const baseUrl of candidateBaseUrls) {
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}/health`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
        BACKEND_PROBE_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Backend probe to ${baseUrl}/health returned ${response.status}.`);
      }

      cachedBackendApiBaseUrl = baseUrl;
      return baseUrl;
    } catch (error) {
      lastProbeError =
        error instanceof Error
          ? error
          : new Error(`Unable to reach the backend at ${baseUrl}/health.`);
    }
  }

  const attemptedUrls = candidateBaseUrls.join(', ');
  throw new Error(
    `${lastProbeError?.message ?? 'Unable to reach the backend.'} Tried ${attemptedUrls}. For Expo web use localhost, for the Android emulator use http://10.0.2.2:${BACKEND_PORT}, and for a physical phone set EXPO_PUBLIC_BACKEND_API_URL to your computer's LAN IP.`
  );
}

export async function resolveBackendWebSocketUrl(path: string, query?: Record<string, string>): Promise<string> {
  const baseUrl = await resolveBackendApiBaseUrl();
  const wsBaseUrl = baseUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  const url = new URL(path, `${wsBaseUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function buildHeaders(initHeaders?: HeadersInit, includeAuth = true): Promise<Headers> {
  const headers = new Headers(initHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (includeAuth) {
    const token = authTokenProvider?.();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, includeAuth = true): Promise<T> {
  const baseUrl = await resolveBackendApiBaseUrl();
  const headers = await buildHeaders(init.headers, includeAuth);
  const response = await fetchWithTimeout(
    `${baseUrl}${path}`,
    {
      ...init,
      headers,
    },
    BACKEND_REQUEST_TIMEOUT_MS
  );
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? `Request to ${path} failed with status ${response.status}.`);
  }

  return payload as T;
}

export async function apiGet<T>(path: string, includeAuth = true): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' }, includeAuth);
}

export async function apiPostJson<T>(
  path: string,
  body: unknown,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  includeAuth = true
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    includeAuth
  );
}

export async function apiPatchJson<T>(path: string, body: unknown, includeAuth = true): Promise<T> {
  return apiPostJson<T>(path, body, 'PATCH', includeAuth);
}

export async function apiFormData<T>(
  path: string,
  body: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  includeAuth = true
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method,
      body,
    },
    includeAuth
  );
}

export async function apiPostFormData<T>(path: string, body: FormData, includeAuth = true): Promise<T> {
  return apiFormData<T>(path, body, 'POST', includeAuth);
}

export async function apiPutFormData<T>(path: string, body: FormData, includeAuth = true): Promise<T> {
  return apiFormData<T>(path, body, 'PUT', includeAuth);
}

export async function apiDelete<T = void>(path: string, includeAuth = true): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' }, includeAuth);
}
