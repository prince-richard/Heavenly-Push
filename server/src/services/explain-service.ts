import { parseReference } from '../utils/reference-parser';
import { BollsBibleProvider } from '../providers/bible/bolls-bible-provider';
import { generateWithFallback } from './ai-fallback-manager';
import { SimpleCache } from '../utils/cache';
import { config } from '../config/env';

const bibleProvider = new BollsBibleProvider();
const cache = new SimpleCache<ExplainResult>(10 * 60 * 1000); // 10 min TTL
const chatCache = new SimpleCache<ChatResult>(10 * 60 * 1000); // 10 min TTL
const searchCache = new SimpleCache<SearchResult>(10 * 60 * 1000); // 10 min TTL
const dailyCache = new SimpleCache<DailyVerseResult>(24 * 60 * 60 * 1000); // 24 hour TTL

export interface ExplainRequest {
  question: string;
  reference?: string;
  preferredLanguage: 'en' | 'ta';
  includeParallelText: boolean;
  provider?: 'gemini' | 'openrouter';
}

export interface ExplainResult {
  reference: string;
  englishVerse: string;
  tamilVerse: string;
  explanation: string;
  shortSummary: string;
  providerUsed: string;
  fallbackUsed: boolean;
  warnings: string[];
}

export async function explainVerse(request: ExplainRequest): Promise<ExplainResult> {
  const { question, preferredLanguage, includeParallelText } = request;

  // 1. Parse the reference from either explicit field or question text
  const refText = request.reference ?? question;
  const parsed = parseReference(refText);
  if (!parsed) {
    throw new ExplainError(
      'Could not find a valid Bible reference. Please include a reference like "John 3:16".',
      'INVALID_REFERENCE'
    );
  }

  // 2. Check cache
  const cacheKey = `${parsed.bookCode}:${parsed.chapter}:${parsed.verse}:${question}:${preferredLanguage}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // 3. Fetch verse text (always fetch both for grounding)
  const parallel = await bibleProvider.getParallelVerse(
    parsed,
    config.englishBibleVersion,
    config.tamilBibleVersion
  );

  if (!parallel.english.found && !parallel.tamil.found) {
    throw new ExplainError(
      `Verse not found: ${parsed.book} ${parsed.chapter}:${parsed.verse}`,
      'VERSE_NOT_FOUND'
    );
  }

  const englishText = parallel.english.found ? parallel.english.text : '';
  const tamilText = parallel.tamil.found ? parallel.tamil.text : '';

  // 4. Call AI with grounded verse text
  const { output, fallbackUsed, warnings } = await generateWithFallback({
    verseText: englishText || tamilText,
    reference: `${parsed.book} ${parsed.chapter}:${parsed.verse}`,
    question,
    language: preferredLanguage === 'ta' ? 'Tamil' : 'English',
    tamilVerse: includeParallelText ? tamilText : undefined,
  });

  const result: ExplainResult = {
    reference: `${parsed.book} ${parsed.chapter}:${parsed.verse}`,
    englishVerse: englishText,
    tamilVerse: tamilText,
    explanation: output.explanation,
    shortSummary: output.shortSummary,
    providerUsed: output.provider,
    fallbackUsed,
    warnings,
  };

  // 5. Cache the result
  cache.set(cacheKey, result);

  return result;
}

export interface ChatRequest {
  question: string;
  preferredLanguage: 'en' | 'ta';
}

export interface ChatResult {
  answer: string;
  references: Array<{ reference: string; text: string }>;
  providerUsed: string;
}

export async function chatAboutBible(request: ChatRequest): Promise<ChatResult> {
  const { question, preferredLanguage } = request;

  // Check cache
  const cacheKey = `chat:${question}:${preferredLanguage}`;
  const cached = chatCache.get(cacheKey);
  if (cached) return cached;

  // Try to parse a reference from the question
  const parsed = parseReference(question);
  let verseContext = '';
  const references: Array<{ reference: string; text: string }> = [];

  if (parsed) {
    // Fetch verse text to ground the AI response
    try {
      const parallel = await bibleProvider.getParallelVerse(
        parsed,
        config.englishBibleVersion,
        config.tamilBibleVersion
      );

      const englishText = parallel.english.found ? parallel.english.text : '';
      const tamilText = parallel.tamil.found ? parallel.tamil.text : '';
      const refStr = `${parsed.book} ${parsed.chapter}:${parsed.verse}`;

      if (englishText || tamilText) {
        verseContext = `\n\nReferenced Verse: ${refStr}\nEnglish: ${englishText}\nTamil: ${tamilText}`;
        references.push({
          reference: refStr,
          text: preferredLanguage === 'ta' ? (tamilText || englishText) : (englishText || tamilText),
        });
      }
    } catch {
      // If verse fetch fails, proceed without it
    }
  }

  // Build the user message for the AI
  const language = preferredLanguage === 'ta' ? 'Tamil' : 'English';
  const userMessage = `Question: ${question}\nPreferred Language: ${language}${verseContext}\n\nPlease provide a clear, helpful answer. Do NOT respond in JSON — just provide your answer as plain text.`;

  // Use the fallback manager with a chat-specific input
  const { output } = await generateWithFallback({
    verseText: verseContext ? 'See referenced verse below' : 'No specific verse referenced',
    reference: parsed ? `${parsed.book} ${parsed.chapter}:${parsed.verse}` : 'General question',
    question: userMessage,
    language,
  });

  // The AI may return JSON (because the prompt builder asks for it) — extract the explanation
  let answer = output.explanation;

  // Clean up: if the answer looks like it still has JSON artifacts, strip them
  if (answer.startsWith('{') || answer.startsWith('"')) {
    try {
      const parsed2 = JSON.parse(answer) as { explanation?: string };
      if (parsed2.explanation) answer = parsed2.explanation;
    } catch {
      // Use as-is
    }
  }

  const result: ChatResult = {
    answer,
    references,
    providerUsed: output.provider,
  };

  chatCache.set(cacheKey, result);

  return result;
}

// ============================================================================
// AI-powered semantic search
// ============================================================================

export interface SearchRequest {
  query: string;
  preferredLanguage: 'en' | 'ta';
  limit?: number;
}

export interface SearchHit {
  reference: string;
  englishText: string;
  tamilText: string;
  snippet: string;
}

export interface SearchResult {
  hits: SearchHit[];
  providerUsed: string;
}

/**
 * Extracts the first balanced JSON array from a string.
 * AI providers often wrap JSON in code fences or prose.
 */
function extractJsonArray(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

export async function searchBibleWithAi(request: SearchRequest): Promise<SearchResult> {
  const { query, preferredLanguage } = request;
  const limit = Math.max(1, Math.min(request.limit ?? 5, 10));

  const cacheKey = `search:${query}:${preferredLanguage}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const language = preferredLanguage === 'ta' ? 'Tamil' : 'English';
  const prompt = `You are a Bible search assistant. The user is searching for verses about: "${query}"

Return up to ${limit} of the most relevant Bible verses that match this query (by reference, theme, or keywords).

Respond with ONLY a valid JSON array — no prose, no markdown, no code fences. Each item must have this exact shape:
[
  {"reference": "Book Chapter:Verse", "englishText": "KJV or ESV English text", "tamilText": "Tamil text if known, else empty string", "snippet": "Short 1-line reason this verse matches"}
]

Preferred response language for snippet: ${language}. Keep references in standard English form (e.g. "John 3:16"). Do NOT include any commentary outside the JSON.`;

  const { output } = await generateWithFallback({
    verseText: 'N/A — search task',
    reference: 'N/A',
    question: prompt,
    language,
  });

  const raw = output.explanation ?? '';
  const jsonStr = extractJsonArray(raw);
  let hits: SearchHit[] = [];
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as Array<Partial<SearchHit>>;
      hits = parsed
        .filter((h) => h && typeof h.reference === 'string')
        .map((h) => ({
          reference: String(h.reference),
          englishText: typeof h.englishText === 'string' ? h.englishText : '',
          tamilText: typeof h.tamilText === 'string' ? h.tamilText : '',
          snippet: typeof h.snippet === 'string' ? h.snippet : '',
        }))
        .slice(0, limit);
    } catch {
      hits = [];
    }
  }

  const result: SearchResult = { hits, providerUsed: output.provider };
  searchCache.set(cacheKey, result);
  return result;
}

// ============================================================================
// AI-powered daily verse
// ============================================================================

export interface DailyVerseResult {
  reference: string;
  englishText: string;
  tamilText: string;
  providerUsed: string;
}

function getDailyKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export async function getAiDailyVerse(preferredLanguage: 'en' | 'ta'): Promise<DailyVerseResult> {
  const dayKey = getDailyKey();
  const cacheKey = `daily:${dayKey}:${preferredLanguage}`;
  const cached = dailyCache.get(cacheKey);
  if (cached) return cached;

  const language = preferredLanguage === 'ta' ? 'Tamil' : 'English';
  const prompt = `Select one uplifting Bible verse to share as the verse of the day for ${dayKey}. Pick something encouraging — love, hope, faith, peace, courage, or comfort.

Respond with ONLY a JSON object, no prose or code fences:
{"reference": "Book Chapter:Verse", "englishText": "KJV English text", "tamilText": "Tamil translation if known, else empty"}

Preferred response language: ${language}. Reference must be in standard English form.`;

  const { output } = await generateWithFallback({
    verseText: 'N/A — daily verse',
    reference: 'N/A',
    question: prompt,
    language,
  });

  const raw = output.explanation ?? '';
  // Extract first JSON object
  let verse: { reference?: string; englishText?: string; tamilText?: string } = {};
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      verse = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      verse = {};
    }
  }

  // If AI didn't give us English text, try to fetch it via the Bible provider for accuracy.
  let englishText = typeof verse.englishText === 'string' ? verse.englishText : '';
  let tamilText = typeof verse.tamilText === 'string' ? verse.tamilText : '';
  const reference = typeof verse.reference === 'string' ? verse.reference : 'John 3:16';

  if (!englishText || !tamilText) {
    const parsed = parseReference(reference);
    if (parsed) {
      try {
        const parallel = await bibleProvider.getParallelVerse(
          parsed,
          config.englishBibleVersion,
          config.tamilBibleVersion
        );
        if (!englishText && parallel.english.found) englishText = parallel.english.text;
        if (!tamilText && parallel.tamil.found) tamilText = parallel.tamil.text;
      } catch {
        // fall through with what we have
      }
    }
  }

  const result: DailyVerseResult = {
    reference,
    englishText,
    tamilText,
    providerUsed: output.provider,
  };
  dailyCache.set(cacheKey, result);
  return result;
}

export class ExplainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ExplainError';
  }
}
