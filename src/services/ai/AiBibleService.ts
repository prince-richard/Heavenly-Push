import { Platform } from 'react-native';

// On web production: relative URL (same Vercel origin)
// On dev or native: localhost server
const API_BASE =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3001'
    : Platform.OS === 'web'
      ? ''  // same-origin on Vercel
      : 'https://heavenly-push.vercel.app';

export interface ExplainRequest {
  question: string;
  reference?: string;
  preferredLanguage: 'en' | 'ta';
  includeParallelText: boolean;
  provider?: 'gemini' | 'openrouter';
}

export interface ExplainResponse {
  reference: string;
  englishVerse: string;
  tamilVerse: string;
  explanation: string;
  shortSummary: string;
  providerUsed: string;
  fallbackUsed: boolean;
  warnings: string[];
}

export interface ChatRequest {
  question: string;
  preferredLanguage: 'en' | 'ta';
}

export interface ChatResponse {
  answer: string;
  references: Array<{ reference: string; text: string }>;
  providerUsed: string;
}

export interface AiSearchHit {
  reference: string;
  englishText: string;
  tamilText: string;
  snippet: string;
}

export interface AiSearchResponse {
  hits: AiSearchHit[];
  providerUsed: string;
}

export interface AiDailyVerseResponse {
  reference: string;
  englishText: string;
  tamilText: string;
  providerUsed: string;
}

export interface AskVerse {
  reference: string;
  englishText: string;
  tamilText: string;
  snippet: string;
}

export interface AskResponse {
  answer: string;
  verses: AskVerse[];
  detectedLanguage: 'en' | 'ta';
  providerUsed: string;
}

export interface ParallelVerseResponse {
  reference: string;
  english: { reference: string; text: string; version: string; found: boolean };
  tamil: { reference: string; text: string; version: string; found: boolean };
}

export async function chatWithBible(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/ai-bible/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function askAnything(
  question: string,
  hintedLanguage?: 'en' | 'ta',
): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/api/ai-bible/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, hintedLanguage }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function aiSearch(
  query: string,
  preferredLanguage: 'en' | 'ta',
  limit = 5,
): Promise<AiSearchResponse> {
  const res = await fetch(`${API_BASE}/api/ai-bible/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, preferredLanguage, limit }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getAiDailyVerse(
  preferredLanguage: 'en' | 'ta',
): Promise<AiDailyVerseResponse> {
  const res = await fetch(
    `${API_BASE}/api/ai-bible/daily?lang=${preferredLanguage}`,
    { method: 'GET' },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getVerseByReference(
  reference: string,
): Promise<ParallelVerseResponse> {
  const res = await fetch(
    `${API_BASE}/api/ai-bible/parallel?ref=${encodeURIComponent(reference)}`,
    { method: 'GET' },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function explainVerse(request: ExplainRequest): Promise<ExplainResponse> {
  const res = await fetch(`${API_BASE}/api/ai-bible/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }

  return res.json();
}
