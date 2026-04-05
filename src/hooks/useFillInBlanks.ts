import { useState, useCallback, useMemo } from 'react';
import type { BibleVerse, SupportedLanguage } from '@/types/models';

interface BlankSegment {
  text: string;
  isBlank: boolean;
  answer: string;
  originalWord: string;
}

interface FillInBlanksResult {
  segments: BlankSegment[];
  score: number;
  submitAnswer: (index: number, answer: string) => void;
  isComplete: boolean;
  reset: () => void;
}

// Common words to skip when creating blanks (articles, prepositions, conjunctions)
const SKIP_WORDS_EN = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'and', 'or', 'but', 'nor', 'so', 'yet', 'is', 'am', 'are',
  'was', 'were', 'be', 'been', 'being', 'it', 'he', 'she', 'we', 'they',
  'i', 'me', 'my', 'his', 'her', 'our', 'your', 'its', 'that', 'this',
  'not', 'no', 'do', 'did', 'has', 'had', 'have', 'will', 'shall',
]);

const SKIP_WORDS_TA = new Set([
  'ஒரு', 'அது', 'இது', 'நான்', 'நீ', 'அவன்', 'அவள்', 'மற்றும்',
  'என்', 'உன்', 'அந்த', 'இந்த',
]);

function getSkipWords(language: SupportedLanguage): Set<string> {
  return language === 'en' ? SKIP_WORDS_EN : SKIP_WORDS_TA;
}

function createSegments(
  text: string,
  language: SupportedLanguage
): BlankSegment[] {
  const skipWords = getSkipWords(language);
  const words = text.split(/\s+/);

  // Determine which word indices are content words (candidates for blanking)
  const contentIndices: number[] = [];
  words.forEach((word, index) => {
    const cleanWord = word.replace(/[.,;:!?"'()]/g, '').toLowerCase();
    if (cleanWord.length > 1 && !skipWords.has(cleanWord)) {
      contentIndices.push(index);
    }
  });

  // Blank 30-40% of content words
  const blankCount = Math.max(
    1,
    Math.round(contentIndices.length * (0.3 + Math.random() * 0.1))
  );

  // Randomly select which content words to blank
  const shuffled = [...contentIndices].sort(() => Math.random() - 0.5);
  const blankedIndices = new Set(shuffled.slice(0, blankCount));

  return words.map((word, index) => ({
    text: word,
    isBlank: blankedIndices.has(index),
    answer: '',
    originalWord: word.replace(/[.,;:!?"'()]/g, ''),
  }));
}

export function useFillInBlanks(
  verse: BibleVerse | null,
  language: SupportedLanguage
): FillInBlanksResult {
  const text = useMemo(() => {
    if (!verse) return '';
    return language === 'en' ? verse.textEn ?? '' : verse.textTa ?? verse.textEn ?? '';
  }, [verse, language]);

  const [segments, setSegments] = useState<BlankSegment[]>(() =>
    text ? createSegments(text, language) : []
  );

  const score = useMemo(() => {
    const blanks = segments.filter((s) => s.isBlank);
    if (blanks.length === 0) return 0;
    const correct = blanks.filter(
      (s) => s.answer.toLowerCase().trim() === s.originalWord.toLowerCase()
    ).length;
    return Math.round((correct / blanks.length) * 100);
  }, [segments]);

  const isComplete = useMemo(() => {
    const blanks = segments.filter((s) => s.isBlank);
    return blanks.length > 0 && blanks.every((s) => s.answer.trim().length > 0);
  }, [segments]);

  const submitAnswer = useCallback((index: number, answer: string) => {
    setSegments((prev) =>
      prev.map((seg, i) => (i === index ? { ...seg, answer } : seg))
    );
  }, []);

  const reset = useCallback(() => {
    if (text) {
      setSegments(createSegments(text, language));
    }
  }, [text, language]);

  return {
    segments,
    score,
    submitAnswer,
    isComplete,
    reset,
  };
}
