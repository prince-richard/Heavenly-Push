import { useState, useEffect, useCallback } from 'react';
import type { BibleVerse } from '@/types/models';
import { getDatabase } from '@/db/database';
import { VerseRepository } from '@/db/repositories/VerseRepository';

interface VerseContextResult {
  currentVerse: BibleVerse | null;
  previousVerses: BibleVerse[];
  nextVerses: BibleVerse[];
  loading: boolean;
  loadContext: () => void;
}

export function useVerseContext(
  verseId: string,
  range: number = 2
): VerseContextResult {
  const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null);
  const [previousVerses, setPreviousVerses] = useState<BibleVerse[]>([]);
  const [nextVerses, setNextVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      const repo = new VerseRepository(db);

      const verse = repo.getById(verseId);
      setCurrentVerse(verse);

      if (verse) {
        const context = repo.getContext(verseId, range) as BibleVerse[];
        const currentIndex = context.findIndex((v: BibleVerse) => v.id === verseId);

        if (currentIndex >= 0) {
          setPreviousVerses(context.slice(0, currentIndex));
          setNextVerses(context.slice(currentIndex + 1));
        } else {
          setPreviousVerses([]);
          setNextVerses([]);
        }
      }
    } catch {
      setCurrentVerse(null);
      setPreviousVerses([]);
      setNextVerses([]);
    } finally {
      setLoading(false);
    }
  }, [verseId, range]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  return {
    currentVerse,
    previousVerses,
    nextVerses,
    loading,
    loadContext,
  };
}
