import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface DrinkDetection {
  label: string;
  drink_type: string;
  confidence: number;
  bbox: number[];
  is_drinking: boolean;
}

export interface DrinkAnalysisSummary {
  has_detections: boolean;
  has_drinking_action: boolean;
  contains_beer: boolean;
  crown_eligible: boolean;
  drink_count: number;
  drink_types: string[];
  top_drink: string | null;
  top_confidence: number | null;
  status_label: string;
  headline: string;
  message: string;
}

export interface DrinkAnalysisDebug {
  persons: number[][];
  faces: number[][];
  mouth_zones: number[][];
}

export interface DrinkAnalysisApiResponse {
  detections: DrinkDetection[];
  summary: DrinkAnalysisSummary;
  debug: DrinkAnalysisDebug;
  annotated_image: string;
}

export interface DrinkAnalysisResult extends DrinkAnalysisApiResponse {
  crownEligible: boolean;
  detectedDrinks: string[];
  topDrink: string | null;
}

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

const DETECTION_PORT = 8000;
const DETECTION_PROBE_TIMEOUT_MS = 2500;
const DETECTION_REQUEST_TIMEOUT_MS = 20000;
let cachedDetectionApiBaseUrl: string | null = null;

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
  const uniqueHosts = Array.from(new Set(hosts));

  return uniqueHosts.sort((left, right) => getHostPriority(right) - getHostPriority(left));
}

export function getDetectionApiBaseUrlCandidates(): string[] {
  const configuredUrl = process.env.EXPO_PUBLIC_DETECTION_API_URL?.trim();
  const candidates: string[] = [];

  if (configuredUrl) {
    candidates.push(trimTrailingSlash(configuredUrl));
  }

  for (const host of getExpoHosts()) {
    candidates.push(`http://${host}:${DETECTION_PORT}`);
  }

  candidates.push(`http://127.0.0.1:${DETECTION_PORT}`);
  candidates.push(`http://localhost:${DETECTION_PORT}`);

  return Array.from(new Set(candidates.map(trimTrailingSlash)));
}

export function getDetectionApiBaseUrl(): string {
  return cachedDetectionApiBaseUrl ?? getDetectionApiBaseUrlCandidates()[0];
}

async function buildDetectionFormData(photoUri: string): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const fileResponse = await fetch(photoUri);
    const photoBlob = await fileResponse.blob();
    formData.append('file', photoBlob, 'capture.jpg');
    return formData;
  }

  formData.append('file', {
    uri: photoUri,
    name: 'capture.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  return formData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDrinkAnalysisApiResponse(value: unknown): value is DrinkAnalysisApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.detections) &&
    isRecord(value.summary) &&
    isRecord(value.debug) &&
    typeof value.annotated_image === 'string'
  );
}

function getErrorMessage(payload: unknown): string | null {
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

async function fetchDetectionResult(url: string, formData: FormData): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DETECTION_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Detection request to ${url} timed out. Check that the backend is reachable from your device.`);
    }

    throw new Error(`Unable to reach the detection backend at ${url}. Check your API URL and local network access.`);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveDetectionApiBaseUrl(): Promise<string> {
  const candidateBaseUrls = [
    ...(cachedDetectionApiBaseUrl ? [cachedDetectionApiBaseUrl] : []),
    ...getDetectionApiBaseUrlCandidates().filter((baseUrl) => baseUrl !== cachedDetectionApiBaseUrl),
  ];

  let lastProbeError: Error | null = null;

  for (const baseUrl of candidateBaseUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DETECTION_PROBE_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Backend probe to ${baseUrl}/api/health returned ${response.status}.`);
      }

      cachedDetectionApiBaseUrl = baseUrl;
      return baseUrl;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastProbeError = new Error(`Backend probe to ${baseUrl}/api/health timed out.`);
      } else {
        lastProbeError =
          error instanceof Error
            ? error
            : new Error(`Unable to reach the detection backend at ${baseUrl}/api/health.`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const attemptedUrls = candidateBaseUrls.join(', ');
  throw new Error(
    `${lastProbeError?.message ?? 'Unable to reach the detection backend.'} Tried ${attemptedUrls}. If you are testing on a physical phone, set EXPO_PUBLIC_DETECTION_API_URL to your computer's LAN address, for example http://192.168.1.20:${DETECTION_PORT}.`
  );
}

export async function analyzeBeer(photoUri: string): Promise<DrinkAnalysisResult> {
  const baseUrl = await resolveDetectionApiBaseUrl();
  const formData = await buildDetectionFormData(photoUri);
  const response = await fetchDetectionResult(`${baseUrl}/api/detect`, formData);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = { error: 'Backend returned invalid JSON.' };
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) ?? 'Detection request failed.');
  }

  if (!isDrinkAnalysisApiResponse(payload)) {
    throw new Error(getErrorMessage(payload) ?? 'Detection response was missing expected fields.');
  }

  return {
    ...payload,
    crownEligible: payload.summary.crown_eligible,
    detectedDrinks: payload.summary.drink_types,
    topDrink: payload.summary.top_drink,
  };
}
