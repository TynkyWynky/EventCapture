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

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function getExpoHost(): string | null {
  const expoGoConfig = (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig;
  const debuggerHost = expoGoConfig?.debuggerHost;
  if (!debuggerHost) {
    return null;
  }

  const [host] = debuggerHost.split(':');
  return host || null;
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

export async function analyzeBeer(photoUri: string): Promise<DrinkAnalysisResult> {
  const formData = new FormData();
  await appendPhoto(formData, photoUri);

  const response = await fetch(`${getDetectionApiBaseUrl()}/api/detect`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  let payload: DrinkAnalysisApiResponse | { error?: string };
  try {
    payload = await response.json();
  } catch {
    payload = { error: 'Backend returned invalid JSON.' };
  }

  if (!response.ok || 'error' in payload) {
    throw new Error(payload.error || 'Detection request failed.');
  }

  return {
    ...payload,
    crownEligible: payload.summary.crown_eligible,
    detectedDrinks: payload.summary.drink_types,
    topDrink: payload.summary.top_drink,
  };
}
