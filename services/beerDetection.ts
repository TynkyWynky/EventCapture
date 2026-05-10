import { apiPostFormData } from '@/services/backendApi';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import jpeg from 'jpeg-js';
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

type DetectionMode = 'backend' | 'local' | 'auto';

interface PixelSummary {
  sampleCount: number;
  amberCount: number;
  foamCount: number;
  centerAmberCount: number;
  upperAmberCount: number;
  warmDarkCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  rowBuckets: Set<number>;
}

const DEFAULT_LOCAL_BBOX = [0.2, 0.18, 0.8, 0.9] as const;

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHsv(red: number, green: number, blue: number): { h: number; s: number; v: number } {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta > 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) {
      hue += 360;
    }
  }

  const saturation = max === 0 ? 0 : delta / max;
  return { h: hue, s: saturation, v: max };
}

function createEmptyPixelSummary(): PixelSummary {
  return {
    sampleCount: 0,
    amberCount: 0,
    foamCount: 0,
    centerAmberCount: 0,
    upperAmberCount: 0,
    warmDarkCount: 0,
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    rowBuckets: new Set<number>(),
  };
}

function updateBoundingBox(summary: PixelSummary, x: number, y: number) {
  summary.minX = Math.min(summary.minX, x);
  summary.minY = Math.min(summary.minY, y);
  summary.maxX = Math.max(summary.maxX, x);
  summary.maxY = Math.max(summary.maxY, y);
}

function buildLocalSummary({
  beerScore,
  containsBeer,
  crownEligible,
  hasDrinkingAction,
}: {
  beerScore: number;
  containsBeer: boolean;
  crownEligible: boolean;
  hasDrinkingAction: boolean;
}): DrinkAnalysisSummary {
  if (!containsBeer) {
    return {
      has_detections: false,
      has_drinking_action: false,
      contains_beer: false,
      crown_eligible: false,
      drink_count: 0,
      drink_types: [],
      top_drink: null,
      top_confidence: Number(beerScore.toFixed(3)),
      status_label: 'NO_MATCH',
      headline: 'No beer match found',
      message: 'On-device analysis did not find a strong beer-like color pattern in this photo.',
    };
  }

  if (!crownEligible) {
    return {
      has_detections: true,
      has_drinking_action: hasDrinkingAction,
      contains_beer: true,
      crown_eligible: false,
      drink_count: 1,
      drink_types: ['Beer'],
      top_drink: 'Beer',
      top_confidence: Number(beerScore.toFixed(3)),
      status_label: 'CHECK_AGAIN',
      headline: 'Possible beer detected',
      message: 'The APK matched beer-like colors, but confidence was not high enough for a crown-eligible result.',
    };
  }

  return {
    has_detections: true,
    has_drinking_action: hasDrinkingAction,
    contains_beer: true,
    crown_eligible: true,
    drink_count: 1,
    drink_types: ['Beer'],
    top_drink: 'Beer',
    top_confidence: Number(beerScore.toFixed(3)),
    status_label: 'CROWN_READY',
    headline: 'Beer detected on-device',
    message: 'This capture was analyzed locally inside the app and passed the embedded beer check.',
  };
}

function buildLocalDetection(width: number, height: number, summary: PixelSummary, confidence: number): DrinkDetection[] {
  if (summary.amberCount === 0) {
    return [];
  }

  let bbox: number[] = [...DEFAULT_LOCAL_BBOX];
  if (Number.isFinite(summary.minX) && Number.isFinite(summary.minY) && Number.isFinite(summary.maxX) && Number.isFinite(summary.maxY)) {
    bbox = [
      clamp(summary.minX / width, 0, 1),
      clamp(summary.minY / height, 0, 1),
      clamp(summary.maxX / width, 0, 1),
      clamp(summary.maxY / height, 0, 1),
    ];
  }

  return [
    {
      label: 'beer',
      drink_type: 'Beer',
      confidence: Number(confidence.toFixed(3)),
      bbox: [
        Math.round(bbox[0] * width),
        Math.round(bbox[1] * height),
        Math.round(bbox[2] * width),
        Math.round(bbox[3] * height),
      ],
      is_drinking: confidence >= 0.78,
      rotation_degrees: 0,
      rotated_bbox: [],
    },
  ];
}

async function analyzeLocally(
  photoUri: string,
  options: DrinkAnalysisRequestOptions
): Promise<DrinkAnalysisApiResponse> {
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = Buffer.from(base64, 'base64');
  const decoded = jpeg.decode(bytes, {
    useTArray: true,
    formatAsRGBA: true,
    tolerantDecoding: true,
  });

  const { width, height, data } = decoded;
  const totalPixels = Math.max(1, width * height);
  const sampleStride = Math.max(1, Math.floor(Math.sqrt(totalPixels / 30000)));
  const summary = createEmptyPixelSummary();
  const centerMinX = Math.floor(width * 0.2);
  const centerMaxX = Math.ceil(width * 0.8);
  const upperAmberLimit = Math.ceil(height * 0.46);

  for (let y = 0; y < height; y += sampleStride) {
    for (let x = 0; x < width; x += sampleStride) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 16) {
        continue;
      }

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const { h, s, v } = rgbToHsv(red, green, blue);
      summary.sampleCount += 1;

      const isAmber = h >= 18 && h <= 56 && s >= 0.28 && v >= 0.18 && v <= 0.95;
      const isFoam = v >= 0.78 && s <= 0.22;
      const isWarmDark = h >= 18 && h <= 45 && s >= 0.2 && v >= 0.08 && v <= 0.35;

      if (isFoam) {
        summary.foamCount += 1;
      }

      if (isWarmDark) {
        summary.warmDarkCount += 1;
      }

      if (!isAmber) {
        continue;
      }

      summary.amberCount += 1;
      updateBoundingBox(summary, x, y);
      summary.rowBuckets.add(Math.floor((y / height) * 12));

      if (x >= centerMinX && x <= centerMaxX) {
        summary.centerAmberCount += 1;
      }
      if (y <= upperAmberLimit) {
        summary.upperAmberCount += 1;
      }
    }
  }

  const amberRatio = summary.amberCount / Math.max(1, summary.sampleCount);
  const foamRatio = summary.foamCount / Math.max(1, summary.sampleCount);
  const centerAmberRatio = summary.centerAmberCount / Math.max(1, summary.amberCount);
  const upperAmberRatio = summary.upperAmberCount / Math.max(1, summary.amberCount);
  const warmDarkRatio = summary.warmDarkCount / Math.max(1, summary.sampleCount);
  const verticalCoverage = summary.rowBuckets.size / 12;

  const beerScore = clamp(
    amberRatio * 5.3 +
      centerAmberRatio * 1.6 +
      foamRatio * 2.2 +
      verticalCoverage * 0.7 +
      warmDarkRatio * 0.9 -
      0.18,
    0,
    0.99
  );

  const containsBeer = summary.amberCount >= 150 && beerScore >= 0.42;
  const hasDrinkingAction = containsBeer && upperAmberRatio >= 0.18 && centerAmberRatio >= 0.45;
  const crownEligible = containsBeer && (beerScore >= 0.68 || hasDrinkingAction);
  const detectionSummary = buildLocalSummary({
    beerScore,
    containsBeer,
    crownEligible,
    hasDrinkingAction,
  });

  const now = new Date().toISOString();
  return {
    detections: buildLocalDetection(width, height, summary, beerScore),
    summary: detectionSummary,
    debug: {
      persons: [],
      faces: [],
      head_zones: [],
    },
    annotated_image: `data:image/jpeg;base64,${base64}`,
    capture: {
      id: `local-${Date.now()}`,
      username: null,
      event_id: options.eventId?.trim() || null,
      event_title: options.eventTitle?.trim() || null,
      original_image_url: photoUri,
      annotated_image_url: photoUri,
      source: 'on_device',
      created_at: now,
    },
  };
}

function getDetectionMode(): DetectionMode {
  const rawValue = process.env.EXPO_PUBLIC_DETECTION_MODE?.trim().toLowerCase();
  if (rawValue === 'backend' || rawValue === 'local' || rawValue === 'auto') {
    return rawValue;
  }

  return Platform.OS === 'web' ? 'backend' : 'local';
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

async function analyzeWithBackend(
  photoUri: string,
  options: DrinkAnalysisRequestOptions
): Promise<DrinkAnalysisApiResponse> {
  const formData = await buildDetectionFormData(photoUri, options);
  const payload = await apiPostFormData<unknown>('/api/captures/analyze', formData);
  if (!isDrinkAnalysisApiResponse(payload)) {
    throw new Error(getErrorMessage(payload) ?? 'Detection response was missing expected fields.');
  }
  return payload;
}

function normalizeResult(payload: DrinkAnalysisApiResponse): DrinkAnalysisResult {
  const isOnDeviceCapture = payload.capture.source === 'on_device';
  return {
    ...payload,
    crownEligible: payload.summary.crown_eligible,
    detectedDrinks: payload.summary.drink_types,
    topDrink: payload.summary.top_drink,
    captureId: isOnDeviceCapture ? null : payload.capture.id,
    storedImageUri: payload.capture.original_image_url,
  };
}

export async function analyzeBeer(
  photoUri: string,
  options: DrinkAnalysisRequestOptions = {}
): Promise<DrinkAnalysisResult> {
  const mode = getDetectionMode();

  if (mode === 'local') {
    return normalizeResult(await analyzeLocally(photoUri, options));
  }

  if (mode === 'backend') {
    return normalizeResult(await analyzeWithBackend(photoUri, options));
  }

  try {
    return normalizeResult(await analyzeLocally(photoUri, options));
  } catch (localError) {
    try {
      return normalizeResult(await analyzeWithBackend(photoUri, options));
    } catch (backendError) {
      throw new Error(
        backendError instanceof Error
          ? backendError.message
          : localError instanceof Error
            ? localError.message
            : 'Detection request failed.'
      );
    }
  }
}
