import { apiPostFormData } from '@/services/backendApi';
import { Platform } from 'react-native';

export interface DrinkDetection {
  label: string;
  drink_type: string;
  confidence: number;
  bbox: number[];
  is_drinking: boolean;
  rotation_degrees?: number | null;
  rotated_bbox?: number[][];
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
  head_zones: number[][];
}

export interface StoredCaptureRecord {
  id: string;
  username: string | null;
  event_id: string | null;
  event_title: string | null;
  original_image_url: string;
  annotated_image_url: string;
  source: string;
  created_at: string;
}

export interface DrinkAnalysisApiResponse {
  detections: DrinkDetection[];
  summary: DrinkAnalysisSummary;
  debug: DrinkAnalysisDebug;
  annotated_image: string;
  capture: StoredCaptureRecord;
}

export interface DrinkAnalysisResult extends DrinkAnalysisApiResponse {
  crownEligible: boolean;
  detectedDrinks: string[];
  topDrink: string | null;
  captureId: string | null;
  storedImageUri: string | null;
}

export interface DrinkAnalysisRequestOptions {
  eventId?: string | null;
  eventTitle?: string | null;
}

async function buildDetectionFormData(
  photoUri: string,
  options: DrinkAnalysisRequestOptions
): Promise<FormData> {
  const formData = new FormData();

  if (options.eventId?.trim()) {
    formData.append('event_id', options.eventId.trim());
  }

  if (options.eventTitle?.trim()) {
    formData.append('event_title', options.eventTitle.trim());
  }

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

function isStoredCaptureRecord(value: unknown): value is StoredCaptureRecord {
  if (!isRecord(value)) {
    return false;
  }

  const optionalStringFields = [value.username, value.event_id, value.event_title];
  return (
    typeof value.id === 'string' &&
    typeof value.original_image_url === 'string' &&
    typeof value.annotated_image_url === 'string' &&
    typeof value.source === 'string' &&
    typeof value.created_at === 'string' &&
    optionalStringFields.every((field) => field === null || typeof field === 'string')
  );
}

function isDrinkAnalysisApiResponse(value: unknown): value is DrinkAnalysisApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.detections) &&
    isRecord(value.summary) &&
    isRecord(value.debug) &&
    typeof value.annotated_image === 'string' &&
    isStoredCaptureRecord(value.capture)
  );
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

export async function analyzeBeer(
  photoUri: string,
  options: DrinkAnalysisRequestOptions = {}
): Promise<DrinkAnalysisResult> {
  const formData = await buildDetectionFormData(photoUri, options);
  let payload: unknown;

  try {
    payload = await apiPostFormData<unknown>('/api/captures/analyze', formData);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Detection request failed.'
    );
  }

  if (!isDrinkAnalysisApiResponse(payload)) {
    throw new Error(getErrorMessage(payload) ?? 'Detection response was missing expected fields.');
  }

  return {
    ...payload,
    crownEligible: payload.summary.crown_eligible,
    detectedDrinks: payload.summary.drink_types,
    topDrink: payload.summary.top_drink,
    captureId: payload.capture.id,
    storedImageUri: payload.capture.original_image_url,
  };
}
