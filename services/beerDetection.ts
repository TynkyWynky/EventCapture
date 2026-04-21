export interface DrinkDetection {
  label: string;
  drink_type: string;
  confidence: number;
  bbox: number[];
  is_drinking: boolean;
}

export interface BeerAnalysisResult {
  isCrownWorthy: boolean;
  detections: DrinkDetection[];
  annotatedImage?: string;
}

interface DetectApiResponse {
  detections?: unknown;
  annotated_image?: unknown;
  error?: unknown;
}

const REQUEST_TIMEOUT_MS = 20000;

function getBackendBaseUrl() {
  const rawUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!rawUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_URL. Set it to your detector backend URL, for example http://192.168.1.20:8000.'
    );
  }

  return rawUrl.replace(/\/+$/, '');
}

function getFileName(photoUri: string) {
  const cleanUri = photoUri.split('?')[0] ?? photoUri;
  const name = cleanUri.split('/').pop();
  return name && name.includes('.') ? name : `eventcapture-${Date.now()}.jpg`;
}

function getMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function normalizeDetection(value: unknown): DrinkDetection | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const detection = value as Partial<DrinkDetection>;

  return {
    label: typeof detection.label === 'string' ? detection.label : 'drink',
    drink_type: typeof detection.drink_type === 'string' ? detection.drink_type : 'Drink',
    confidence: typeof detection.confidence === 'number' ? detection.confidence : 0,
    bbox: Array.isArray(detection.bbox)
      ? detection.bbox.filter((coordinate): coordinate is number => typeof coordinate === 'number')
      : [],
    is_drinking: Boolean(detection.is_drinking),
  };
}

export async function analyzeBeer(photoUri: string): Promise<BeerAnalysisResult> {
  const backendBaseUrl = getBackendBaseUrl();
  const fileName = getFileName(photoUri);
  const formData = new FormData();

  formData.append('file', {
    uri: photoUri,
    name: fileName,
    type: getMimeType(fileName),
  } as unknown as Blob);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendBaseUrl}/api/detect`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as DetectApiResponse;

    if (!response.ok) {
      const errorMessage = typeof data.error === 'string' ? data.error : 'Detector backend rejected the image.';
      throw new Error(errorMessage);
    }

    const detections = Array.isArray(data.detections)
      ? data.detections.map(normalizeDetection).filter((item): item is DrinkDetection => Boolean(item))
      : [];

    return {
      isCrownWorthy: detections.length > 0,
      detections,
      annotatedImage: typeof data.annotated_image === 'string' ? data.annotated_image : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Detector request timed out. Check the backend connection and try again.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
