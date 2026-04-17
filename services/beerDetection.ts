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

function getExpoHost(): string | null {
  const constants = Constants as unknown as ExpoConstantsHostShape;

  return (
    [
      extractHost(constants.expoConfig?.hostUri),
      extractHost(constants.expoGoConfig?.debuggerHost),
      extractHost(constants.manifest2?.extra?.expoClient?.hostUri),
      extractHost(constants.manifest?.debuggerHost),
    ].find((host): host is string => Boolean(host)) ?? null
  );
}

export function getDetectionApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_DETECTION_API_URL?.trim();
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:8000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://127.0.0.1:8000';
}

async function appendPhoto(formData: FormData, photoUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    const fileResponse = await fetch(photoUri);
    const photoBlob = await fileResponse.blob();
    formData.append('file', photoBlob, 'capture.jpg');
    return;
  }

  formData.append('file', {
    uri: photoUri,
    name: 'capture.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
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
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      throw new Error('Detection request timed out. Check that the backend is reachable from your device.');
    }

    throw new Error('Unable to reach the detection backend. Check your API URL and local network access.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function analyzeBeer(photoUri: string): Promise<DrinkAnalysisResult> {
  const formData = new FormData();
  await appendPhoto(formData, photoUri);

  const response = await fetchDetectionResult(`${getDetectionApiBaseUrl()}/api/detect`, formData);

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
