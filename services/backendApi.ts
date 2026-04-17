import Constants from 'expo-constants';

interface ExpoConstantsHostShape {
  expoGoConfig?: {
    debuggerHost?: string | null;
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
}

const BACKEND_PORT = 8000;
const BACKEND_PROBE_TIMEOUT_MS = 2500;
const BACKEND_REQUEST_TIMEOUT_MS = 20000;
let cachedBackendApiBaseUrl: string | null = null;

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

  const messageCandidates = [payload.error, payload.detail];
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

export function getBackendApiBaseUrlCandidates(): string[] {
  const configuredUrl =
    process.env.EXPO_PUBLIC_BACKEND_API_URL?.trim() ||
    process.env.EXPO_PUBLIC_DETECTION_API_URL?.trim();
  const candidates: string[] = [];

  if (configuredUrl) {
    candidates.push(trimTrailingSlash(configuredUrl));
  }

  for (const host of getExpoHosts()) {
    candidates.push(`http://${host}:${BACKEND_PORT}`);
  }

  candidates.push(`http://127.0.0.1:${BACKEND_PORT}`);
  candidates.push(`http://localhost:${BACKEND_PORT}`);

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
        `${baseUrl}/api/health`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
        BACKEND_PROBE_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(`Backend probe to ${baseUrl}/api/health returned ${response.status}.`);
      }

      cachedBackendApiBaseUrl = baseUrl;
      return baseUrl;
    } catch (error) {
      lastProbeError =
        error instanceof Error
          ? error
          : new Error(`Unable to reach the backend at ${baseUrl}/api/health.`);
    }
  }

  const attemptedUrls = candidateBaseUrls.join(', ');
  throw new Error(
    `${lastProbeError?.message ?? 'Unable to reach the backend.'} Tried ${attemptedUrls}. If you are testing on a physical phone, set EXPO_PUBLIC_BACKEND_API_URL to your computer's LAN address, for example http://192.168.1.20:${BACKEND_PORT}.`
  );
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = await resolveBackendApiBaseUrl();
  const nextHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  if (init.headers && !Array.isArray(init.headers) && !(init.headers instanceof Headers)) {
    Object.assign(nextHeaders, init.headers);
  }

  const response = await fetchWithTimeout(
    `${baseUrl}${path}`,
    {
      ...init,
      headers: nextHeaders,
    },
    BACKEND_REQUEST_TIMEOUT_MS
  );
  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? `Request to ${path} failed with status ${response.status}.`);
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

export async function apiPostJson<T>(path: string, body: unknown, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  return apiRequest<T>(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function apiPostFormData<T>(path: string, body: FormData): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
  });
}

export async function apiDelete(path: string): Promise<void> {
  await apiRequest(path, { method: 'DELETE' });
}
