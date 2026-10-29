import { waitUntil } from '@vercel/functions';
import { config } from '../config/env';

export interface ConversationLogEntry {
  question: string;
  questionTranslation: string;
  answer: string;
  language: 'en' | 'ta';
  provider: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

/**
 * Records an assistant exchange in Supabase (`public.conversations`).
 * Fire-and-forget: never delays or fails the user's answer. `waitUntil`
 * keeps the Vercel function alive until the insert finishes.
 */
export function logConversation(entry: ConversationLogEntry): void {
  if (!config.supabaseUrl || !config.supabaseSecretKey) return;

  const insert = fetch(`${config.supabaseUrl}/rest/v1/conversations`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseSecretKey,
      Authorization: `Bearer ${config.supabaseSecretKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      question: entry.question,
      question_translation: entry.questionTranslation || null,
      answer: entry.answer || null,
      language: entry.language,
      provider: entry.provider,
      latency_ms: entry.latencyMs,
      success: entry.success,
      error: entry.error ?? null,
    }),
    signal: AbortSignal.timeout(5000),
  })
    .then(async (res) => {
      if (!res.ok) {
        console.warn(`[conversation-log] insert failed ${res.status}: ${await res.text()}`);
      }
    })
    .catch((err) => {
      console.warn('[conversation-log] insert error:', err instanceof Error ? err.message : err);
    });

  waitUntil(insert);
}
