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
const askCache = new SimpleCache<AskResult>(10 * 60 * 1000); // 10 min TTL

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
  const systemPrompt = `You are a warm, knowledgeable Bible study assistant with full knowledge of the entire Bible. Never refuse to answer Bible questions. Reply in plain text in the user's language.`;
  const userMessage = `Question: ${question}\nPreferred Language: ${language}${verseContext}\n\nPlease provide a clear, helpful answer in ${language}. Do NOT respond in JSON — just provide your answer as plain text.`;

  // Use the fallback manager with a chat-specific input
  const { output } = await generateWithFallback({
    verseText: verseContext ? 'See referenced verse below' : 'No specific verse referenced',
    reference: parsed ? `${parsed.book} ${parsed.chapter}:${parsed.verse}` : 'General question',
    question: userMessage,
    language,
    systemPromptOverride: systemPrompt,
    userMessageOverride: userMessage,
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
  const systemPrompt = `You are a Bible search engine with full knowledge of the entire Bible. Never refuse a search. Always return up to ${limit} of the most relevant verses. Reply with ONLY a JSON array — no prose, no markdown.`;
  const userMessage = `Find up to ${limit} Bible verses about: "${query}"

Match by reference, theme, person, book, or keywords. Use your full Bible knowledge — do NOT say "I don't have verses about that".

Respond with ONLY a valid JSON array of this exact shape:
[
  {"reference": "Book Chapter:Verse", "englishText": "KJV or ESV English text", "tamilText": "Tamil text if known, else empty string", "snippet": "Short 1-line reason this verse matches, written in ${language}"}
]

Reference must be in standard English form (e.g. "John 3:16"). Do NOT include any commentary outside the JSON.`;

  const { output } = await generateWithFallback({
    verseText: 'N/A — search task',
    reference: 'N/A',
    question: userMessage,
    language,
    systemPromptOverride: systemPrompt,
    userMessageOverride: userMessage,
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
  const systemPrompt = `You are a Bible curator with full knowledge of the entire Bible. You pick uplifting verses to share. Reply with ONLY a JSON object — no prose, no markdown.`;
  const userMessage = `Select one uplifting Bible verse to share as the verse of the day for ${dayKey}. Pick something encouraging — love, hope, faith, peace, courage, or comfort.

Respond with ONLY a JSON object:
{"reference": "Book Chapter:Verse", "englishText": "KJV English text", "tamilText": "Tamil translation if known, else empty"}

Preferred response language: ${language}. Reference must be in standard English form.`;

  const { output } = await generateWithFallback({
    verseText: 'N/A — daily verse',
    reference: 'N/A',
    question: userMessage,
    language,
    systemPromptOverride: systemPrompt,
    userMessageOverride: userMessage,
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

// ============================================================================
// Unified ask: question -> { answer, verses[], detectedLanguage }
// ============================================================================

export interface AskRequest {
  question: string;
  hintedLanguage?: 'en' | 'ta';
}

export interface AskVerse {
  reference: string;
  englishText: string;
  tamilText: string;
  snippet: string;
}

export interface AskResult {
  answer: string;
  verses: AskVerse[];
  detectedLanguage: 'en' | 'ta';
  providerUsed: string;
}

/**
 * Best-effort language detection from a question string.
 * Tamil Unicode block: U+0B80–U+0BFF.
 */
function detectLanguage(text: string): 'en' | 'ta' {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  return 'en';
}

/**
 * Extract first balanced JSON object from a string (handles code fences).
 */
function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

export async function askAnything(request: AskRequest): Promise<AskResult> {
  const { question } = request;
  const detected: 'en' | 'ta' = request.hintedLanguage ?? detectLanguage(question);
  const language = detected === 'ta' ? 'Tamil' : 'English';

  const cacheKey = `ask:${question}:${detected}`;
  const cached = askCache.get(cacheKey);
  if (cached) return cached;

  // Custom system prompt — the default explain-only prompt would make
  // the model refuse with "I can only explain a given verse".
  const systemPrompt = `You are a warm, knowledgeable Bible assistant for a voice-first bilingual app (English + Tamil). You have full knowledge of the entire Bible — every book, person, place, theme, and verse.

CRITICAL RULES — you MUST follow these:
- NEVER refuse to answer. NEVER say "I don't have verses about that" or "I only explain verses". You DO have the entire Bible.
- ALWAYS try to find relevant verses for any topic, person (like Samuel, David, Moses, Mary), book, place, theme, emotion, or question. Use your full Bible knowledge.
- ALWAYS reply in the SAME language the user used. If they wrote in Tamil, reply in Tamil. If English, reply in English.
- ALWAYS reply with ONLY a valid JSON object (no prose, no markdown, no code fences).
- If a question is unrelated to the Bible, gently redirect to a Bible topic instead of refusing.
- You are talking to elderly and visually impaired users — be warm, patient, and clear.`;

  const userMessage = `The user asked (in ${language}): "${question}"

Reply with ONLY this JSON shape:
{
  "answer": "Your warm, clear conversational answer IN ${language.toUpperCase()}. 2-4 sentences. If they asked about a person (e.g. Samuel), briefly tell who they are and why they matter. If they asked for verses about a topic, briefly introduce them.",
  "verses": [
    {
      "reference": "Book Chapter:Verse",
      "englishText": "KJV or ESV English text of the verse",
      "tamilText": "Tamil translation if known, else empty string",
      "snippet": "1-line reason this verse is relevant, written IN ${language.toUpperCase()}"
    }
  ]
}

Rules for the verses array:
- ALWAYS include 1–6 relevant verses for ANY Bible-related question. Direct matches OR indirect by theme/keyword/concept.
- For questions about Bible people (Samuel, David, Ruth, etc.) include verses about them or their story.
- For questions about books (e.g. "tell me about Psalms") include 2–4 representative verses.
- For topic questions (love, hope, fear, forgiveness) include the most well-known verses.
- Only return an empty verses array if the question is completely unrelated to the Bible.
- Reference must be in standard English form (e.g. "1 Samuel 3:10"), regardless of response language.
- Do NOT include any text outside the JSON object.`;

  const { output } = await generateWithFallback({
    verseText: 'N/A — unified ask',
    reference: 'N/A',
    question: userMessage,
    language,
    systemPromptOverride: systemPrompt,
    userMessageOverride: userMessage,
  });

  const raw = output.explanation ?? '';
  let answer = '';
  let verses: AskVerse[] = [];

  const jsonStr = extractJsonObject(raw);
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as {
        answer?: string;
        verses?: Array<Partial<AskVerse>>;
      };
      if (typeof parsed.answer === 'string') answer = parsed.answer.trim();
      if (Array.isArray(parsed.verses)) {
        verses = parsed.verses
          .filter((v) => v && typeof v.reference === 'string')
          .slice(0, 6)
          .map((v) => ({
            reference: String(v.reference),
            englishText: typeof v.englishText === 'string' ? v.englishText : '',
            tamilText: typeof v.tamilText === 'string' ? v.tamilText : '',
            snippet: typeof v.snippet === 'string' ? v.snippet : '',
          }));
      }
    } catch {
      // fall through to plain-text fallback
    }
  }

  // Fallback: if JSON parsing failed, treat the whole response as the answer.
  if (!answer) {
    answer = raw.replace(/```[\s\S]*?```/g, '').trim();
  }

  const result: AskResult = {
    answer,
    verses,
    detectedLanguage: detected,
    providerUsed: output.provider,
  };
  askCache.set(cacheKey, result);
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
