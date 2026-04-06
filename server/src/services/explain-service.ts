import { parseReference } from '../utils/reference-parser';
import { BollsBibleProvider } from '../providers/bible/bolls-bible-provider';
import { generateWithFallback } from './ai-fallback-manager';
import { SimpleCache } from '../utils/cache';
import { config } from '../config/env';

const bibleProvider = new BollsBibleProvider();
const cache = new SimpleCache<ExplainResult>(10 * 60 * 1000); // 10 min TTL
const chatCache = new SimpleCache<ChatResult>(10 * 60 * 1000); // 10 min TTL

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

export class ExplainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ExplainError';
  }
}
