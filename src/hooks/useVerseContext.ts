import { useState, useEffect, useCallback } from 'react';
import type { BibleVerse } from '@/types/models';
import { useDatabase } from '@/contexts/DatabaseContext';
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
  const db = useDatabase();
  const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null);
  const [previousVerses, setPreviousVerses] = useState<BibleVerse[]>([]);
  const [nextVerses, setNextVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContext = useCallback(async () => {
    setLoading(true);
    try {
      const repo = new VerseRepository(db);

      const verse = await repo.getById(verseId);
      setCurrentVerse(verse);

      if (verse) {
        const context = await repo.getContext(verseId, range) as BibleVerse[];
        const currentIndex = context.findIndex((v: BibleVerse) => v.id === verseId);

        if (currentIndex >= 0) {
          setPreviousVerses(context.slice(0, currentIndex));
          setNextVerses(context.slice(currentIndex + 1));
        } else {
          setPreviousVerses([]);
          setNextVerses([]);
        }
      }
    } catch (error) {
      console.error('useVerseContext error:', error);
      setCurrentVerse(null);
      setPreviousVerses([]);
      setNextVerses([]);
    } finally {
      setLoading(false);
    }
  }, [db, verseId, range]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  return {
    currentVerse,
    previousVerses,
    nextVerses,
    loading,
    loadContext,
  };
}
