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
