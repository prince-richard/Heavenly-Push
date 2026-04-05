import { useCallback, useMemo, useState } from 'react';
import type { BibleVerse, SupportedLanguage } from '@/types/models';
import { ttsService } from '@/services/audio/TTSService';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { normalizedLevenshteinSimilarity } from '@/utils/textSimilarity';

type MemorizationState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'waitingForUser'
  | 'feedback'
  | 'complete';

const SIMILARITY_THRESHOLD = 0.7;
const MIN_CHUNK_WORDS = 3;
const MAX_CHUNK_WORDS = 8;

/**
 * Split text into memorization chunks.
 * 1. Split on sentence punctuation (. ! ?) first
 * 2. If any chunk > MAX_CHUNK_WORDS, split further on commas
 * 3. Ensure minimum MIN_CHUNK_WORDS per chunk (merge with adjacent if too short)
 */
function chunkText(text: string): string[] {
  if (!text.trim()) return [];

  // Step 1: Split on sentence punctuation
  const sentenceChunks = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Step 2: Split long chunks on commas
  const splitChunks: string[] = [];
  for (const chunk of sentenceChunks) {
    const wordCount = chunk.split(/\s+/).length;
    if (wordCount > MAX_CHUNK_WORDS) {
      const subChunks = chunk
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      splitChunks.push(...subChunks);
    } else {
      splitChunks.push(chunk);
    }
  }

  // Step 3: Merge chunks that are too short
  const merged: string[] = [];
  let buffer = '';

  for (const chunk of splitChunks) {
    if (buffer) {
      buffer += ' ' + chunk;
    } else {
      buffer = chunk;
    }

    const wordCount = buffer.split(/\s+/).length;
    if (wordCount >= MIN_CHUNK_WORDS) {
      merged.push(buffer);
      buffer = '';
    }
  }

  // Handle leftover
  if (buffer) {
    if (merged.length > 0) {
      // Merge with last chunk
      merged[merged.length - 1] += ' ' + buffer;
    } else {
      merged.push(buffer);
    }
  }

  return merged;
}

/**
 * Hook for verse memorization practice.
 * Chunks a verse, manages listen/repeat/verify state,
 * compares user speech with text similarity.
 */
export function useMemorization(verse: BibleVerse, language: SupportedLanguage) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [state, setState] = useState<MemorizationState>('idle');
  const [currentFeedback, setCurrentFeedback] = useState<
    'pass' | 'fail' | null
  >(null);

  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);

  // Select verse text based on language with fallback
  const verseText = useMemo(() => {
    if (language === 'ta') {
      return verse.textTa ?? verse.textEn ?? '';
    }
    return verse.textEn ?? verse.textTa ?? '';
  }, [verse, language]);

  const chunks = useMemo(() => chunkText(verseText), [verseText]);

  const progress = useMemo(() => {
    if (chunks.length === 0) return 0;
    return currentChunkIndex / chunks.length;
  }, [currentChunkIndex, chunks.length]);

  /**
   * Start the current chunk: TTS speaks it, then waits for user.
   */
  const startChunk = useCallback(async () => {
    const chunk = chunks[currentChunkIndex];
    if (!chunk) return;

    setState('speaking');
    setCurrentFeedback(null);

    try {
      await ttsService.speak(chunk, language, ttsSpeed);
    } catch {
      // TTS failure is non-fatal
    }

    setState('waitingForUser');
  }, [chunks, currentChunkIndex, language, ttsSpeed]);

  /**
   * Submit a spoken attempt and compare with the expected chunk.
   * Uses text similarity; >= 0.7 is a pass.
   */
  const submitAttempt = useCallback(
    (spokenText: string) => {
      const expected = chunks[currentChunkIndex];
      if (!expected) return;

      const similarity = normalizedLevenshteinSimilarity(
        spokenText.toLowerCase().trim(),
        expected.toLowerCase().trim(),
      );

      const passed = similarity >= SIMILARITY_THRESHOLD;
      setCurrentFeedback(passed ? 'pass' : 'fail');
      setState('feedback');
    },
    [chunks, currentChunkIndex],
  );

  /**
   * Fallback self-assessment when mic is denied.
   */
  const selfAssess = useCallback((passed: boolean) => {
    setCurrentFeedback(passed ? 'pass' : 'fail');
    setState('feedback');
  }, []);

  /**
   * Advance to the next chunk. If all chunks done, mark complete.
   */
  const nextChunk = useCallback(() => {
    const nextIndex = currentChunkIndex + 1;
    if (nextIndex >= chunks.length) {
      setState('complete');
      setCurrentChunkIndex(nextIndex);
    } else {
      setCurrentChunkIndex(nextIndex);
      setState('idle');
      setCurrentFeedback(null);
    }
  }, [currentChunkIndex, chunks.length]);

  /**
   * Reset to the beginning.
   */
  const reset = useCallback(() => {
    setCurrentChunkIndex(0);
    setState('idle');
    setCurrentFeedback(null);
  }, []);

  return {
    chunks,
    currentChunkIndex,
    state,
    currentFeedback,
    progress,
    startChunk,
    submitAttempt,
    selfAssess,
    nextChunk,
    reset,
  };
}
