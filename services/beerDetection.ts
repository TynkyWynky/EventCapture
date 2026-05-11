import { apiPostFormData, getBackendApiBaseUrl, getBackendApiBaseUrlCandidates } from '@/services/backendApi';
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
  analysisSource: 'backend' | 'local';
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
  containerSampleCount: number;
  containerBrightCount: number;
  containerSaturatedCount: number;
  containerContrastCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  rowBuckets: Set<number>;
  columnBuckets: Set<number>;
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
    containerSampleCount: 0,
    containerBrightCount: 0,
    containerSaturatedCount: 0,
    containerContrastCount: 0,
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    rowBuckets: new Set<number>(),
    columnBuckets: new Set<number>(),
  };
}

function updateBoundingBox(summary: PixelSummary, x: number, y: number) {
  summary.minX = Math.min(summary.minX, x);
  summary.minY = Math.min(summary.minY, y);
  summary.maxX = Math.max(summary.maxX, x);
  summary.maxY = Math.max(summary.maxY, y);
}

function buildLocalSummary({
  confidence,
  containsDrink,
  crownEligible,
  statusLabel,
  headline,
  message,
  topDrink,
}: {
  confidence: number;
  containsDrink: boolean;
  crownEligible: boolean;
  statusLabel: string;
  headline: string;
  message: string;
  topDrink: string | null;
}): DrinkAnalysisSummary {
  if (!containsDrink) {
    return {
      has_detections: false,
      has_drinking_action: false,
      contains_beer: false,
      crown_eligible: false,
      drink_count: 0,
      drink_types: [],
      top_drink: topDrink,
      top_confidence: Number(confidence.toFixed(3)),
      status_label: statusLabel,
      headline,
      message,
    };
  }

  return {
    has_detections: true,
    has_drinking_action: false,
    contains_beer: topDrink === 'Beer',
    crown_eligible: crownEligible,
    drink_count: 1,
    drink_types: topDrink ? [topDrink] : ['Drink'],
    top_drink: topDrink,
    top_confidence: Number(confidence.toFixed(3)),
    status_label: statusLabel,
    headline,
    message,
  };
}

function buildLocalDetection(
  width: number,
  height: number,
  summary: PixelSummary,
  confidence: number,
  label: string,
  drinkType: string
): DrinkDetection[] {
  if (summary.containerSampleCount === 0 && summary.amberCount === 0) {
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
      label,
      drink_type: drinkType,
      confidence: Number(confidence.toFixed(3)),
      bbox: [
        Math.round(bbox[0] * width),
        Math.round(bbox[1] * height),
        Math.round(bbox[2] * width),
        Math.round(bbox[3] * height),
      ],
      is_drinking: false,
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
      const isContainerColor =
        (s >= 0.28 && v >= 0.18) ||
        (v >= 0.62 && s <= 0.24) ||
        (red >= 130 && red > green * 1.12 && red > blue * 1.18) ||
        (blue >= 115 && blue > red * 0.95 && blue > green * 1.08) ||
        (green >= 110 && green > red * 1.02 && green > blue * 1.02);

      if (isFoam) {
        summary.foamCount += 1;
      }

      if (isWarmDark) {
        summary.warmDarkCount += 1;
      }

      if (isContainerColor) {
        summary.containerSampleCount += 1;
        updateBoundingBox(summary, x, y);
        summary.rowBuckets.add(Math.floor((y / height) * 12));
        summary.columnBuckets.add(Math.floor((x / width) * 12));
        if (v >= 0.62) {
          summary.containerBrightCount += 1;
        }
        if (s >= 0.28) {
          summary.containerSaturatedCount += 1;
        }
        if ((Math.abs(red - green) + Math.abs(green - blue) + Math.abs(red - blue)) / 3 >= 28) {
          summary.containerContrastCount += 1;
        }
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
  const containerRatio = summary.containerSampleCount / Math.max(1, summary.sampleCount);
  const brightRatio = summary.containerBrightCount / Math.max(1, summary.containerSampleCount);
  const saturatedRatio = summary.containerSaturatedCount / Math.max(1, summary.containerSampleCount);
  const contrastRatio = summary.containerContrastCount / Math.max(1, summary.containerSampleCount);
  const horizontalCoverage = summary.columnBuckets.size / 12;
  const bboxWidth = Number.isFinite(summary.minX) && Number.isFinite(summary.maxX) ? summary.maxX - summary.minX : 0;
  const bboxHeight = Number.isFinite(summary.minY) && Number.isFinite(summary.maxY) ? summary.maxY - summary.minY : 0;
  const aspectRatio = bboxHeight / Math.max(1, bboxWidth);

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
  const containsContainer =
    summary.containerSampleCount >= 90 &&
    containerRatio >= 0.03 &&
    contrastRatio >= 0.2 &&
    aspectRatio >= 0.9 &&
    aspectRatio <= 4.1;
  const containerScore = clamp(
    containerRatio * 4.4 +
      brightRatio * 0.9 +
      saturatedRatio * 1.1 +
      contrastRatio * 1.25 +
      verticalCoverage * 0.65 +
      horizontalCoverage * 0.35 +
      (aspectRatio >= 0.95 && aspectRatio <= 4.0 ? 0.22 : -0.16) -
      0.2,
    0,
    0.99
  );
  const crownEligible = containsBeer ? beerScore >= 0.68 : containsContainer && containerScore >= 0.58;
  const uncertainContainer = !crownEligible && containsContainer && containerScore >= 0.4;
  const confidence = Math.max(beerScore, containerScore);
  const topDrink = containsBeer && beerScore >= containerScore ? 'Beer' : containsContainer ? 'Beverage Can' : null;
  const detectionSummary = buildLocalSummary({
    confidence,
    containsDrink: containsBeer || containsContainer,
    crownEligible,
    statusLabel: crownEligible ? 'drink_detected' : uncertainContainer ? 'drink_uncertain' : 'no_drink_detected',
    headline: crownEligible ? 'Drink detected' : uncertainContainer ? 'Almost there' : 'No drink detected',
    message: crownEligible
      ? 'Your drink container is clearly visible. Challenge validated.'
      : uncertainContainer
        ? 'We could not confirm the drink clearly. Try again with better light and keep the container fully visible.'
        : 'Make sure a glass, bottle, cup, or beverage can is clearly visible in the frame.',
    topDrink,
  });

  const now = new Date().toISOString();
  return {
    detections:
      containsBeer || containsContainer
        ? buildLocalDetection(
            width,
            height,
            summary,
            confidence,
            topDrink === 'Beer' ? 'beer' : 'beverage can',
            topDrink ?? 'Drink'
          )
        : [],
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

  return 'auto';
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
  logDetectionDebug('backend-request', {
    apiBaseUrl: getBackendApiBaseUrl(),
    apiBaseUrlCandidates: getBackendApiBaseUrlCandidates(),
    eventId: options.eventId?.trim() || null,
    eventTitle: options.eventTitle?.trim() || null,
  });
  const payload = await apiPostFormData<unknown>('/api/captures/analyze', formData);
  if (!isDrinkAnalysisApiResponse(payload)) {
    throw new Error(getErrorMessage(payload) ?? 'Detection response was missing expected fields.');
  }
  logDetectionDebug('backend-response', {
    source: payload.capture.source,
    summary: payload.summary,
    detections: payload.detections,
    debug: payload.debug,
  });
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
    analysisSource: isOnDeviceCapture ? 'local' : 'backend',
  };
}

function logDetectionDebug(stage: string, details: Record<string, unknown>) {
  if (!__DEV__) {
    return;
  }

  console.info(`[capture-detection] ${stage}`, details);
}

export async function analyzeBeer(
  photoUri: string,
  options: DrinkAnalysisRequestOptions = {}
): Promise<DrinkAnalysisResult> {
  const mode = getDetectionMode();
  logDetectionDebug('start', {
    mode,
    apiBaseUrl: getBackendApiBaseUrl(),
    apiBaseUrlCandidates: getBackendApiBaseUrlCandidates(),
    eventId: options.eventId?.trim() || null,
    eventTitle: options.eventTitle?.trim() || null,
  });

  if (mode === 'local') {
    const result = normalizeResult(await analyzeLocally(photoUri, options));
    logDetectionDebug('local-only-result', {
      source: result.analysisSource,
      statusLabel: result.summary.status_label,
      headline: result.summary.headline,
      topDrink: result.topDrink,
      topConfidence: result.summary.top_confidence,
      drinks: result.detectedDrinks,
    });
    return result;
  }

  if (mode === 'backend') {
    const result = normalizeResult(await analyzeWithBackend(photoUri, options));
    logDetectionDebug('backend-only-result', {
      source: result.analysisSource,
      statusLabel: result.summary.status_label,
      headline: result.summary.headline,
      topDrink: result.topDrink,
      topConfidence: result.summary.top_confidence,
      drinks: result.detectedDrinks,
    });
    return result;
  }

  try {
    const result = normalizeResult(await analyzeWithBackend(photoUri, options));
    logDetectionDebug('backend-result', {
      source: result.analysisSource,
      statusLabel: result.summary.status_label,
      headline: result.summary.headline,
      topDrink: result.topDrink,
      topConfidence: result.summary.top_confidence,
      drinks: result.detectedDrinks,
    });
    return result;
  } catch (backendError) {
    logDetectionDebug('backend-failed', {
      error: backendError instanceof Error ? backendError.message : String(backendError),
    });
    try {
      const localResult = normalizeResult(await analyzeLocally(photoUri, options));
      logDetectionDebug('local-fallback-result', {
        source: localResult.analysisSource,
        statusLabel: localResult.summary.status_label,
        headline: localResult.summary.headline,
        topDrink: localResult.topDrink,
        topConfidence: localResult.summary.top_confidence,
        drinks: localResult.detectedDrinks,
      });
      if (!localResult.summary.has_detections) {
        throw new Error(
          'We could not analyze the photo. Check your connection and try again.'
        );
      }
      return localResult;
    } catch (localError) {
      logDetectionDebug('local-fallback-failed', {
        backendError: backendError instanceof Error ? backendError.message : String(backendError),
        localError: localError instanceof Error ? localError.message : String(localError),
      });
      throw new Error(
        'We could not analyze the photo. Check your connection and try again.'
      );
    }
  }
}
