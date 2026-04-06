import { Platform } from 'react-native';

const API_BASE =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3001'
    : Platform.OS === 'web'
      ? '' // same-origin on Vercel
      : 'https://heavenly-push.vercel.app';

const REQUEST_TIMEOUT_MS = 8000;

export interface ApiBibleVerse {
  reference: string;
  text: string;
  version: string;
  found: boolean;
}

export interface ApiParallelVerse {
  reference: string;
  english: ApiBibleVerse;
  tamil: ApiBibleVerse;
}

/**
 * Look up a single verse from the server API (backed by Bolls.Life).
 * Pass the raw reference string, e.g. "John 3:16".
 */
export async function lookupVerse(ref: string): Promise<ApiBibleVerse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${API_BASE}/api/bible/verse?ref=${encodeURIComponent(ref)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Verse lookup failed: ${res.status}`);
    }
    return (await res.json()) as ApiBibleVerse;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Look up a verse in both English and Tamil from the server API.
 */
export async function lookupParallelVerse(
  ref: string,
): Promise<ApiParallelVerse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${API_BASE}/api/bible/parallel?ref=${encodeURIComponent(ref)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Parallel lookup failed: ${res.status}`);
    }
    return (await res.json()) as ApiParallelVerse;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    throw error;
  }
}
