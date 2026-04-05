import { useState, useEffect } from 'react';
import type { BibleVerse, DailyVerse } from '@/types/models';
import { useDatabase } from '@/contexts/DatabaseContext';
import { VerseRepository } from '@/db/repositories/VerseRepository';
import { DailyVerseRepository } from '@/db/repositories/DailyVerseRepository';
import { DAILY_VERSE_EXCLUSION_WINDOW } from '@/constants/config';

interface DailyVerseResult {
  verse: BibleVerse | null;
  loading: boolean;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useDailyVerse(): DailyVerseResult {
  const db = useDatabase();
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const dailyRepo = new DailyVerseRepository(db);
        const verseRepo = new VerseRepository(db);
        const today = getTodayDateString();

        // Check if we already have a daily verse for today
        const existing = await dailyRepo.getByDate(today);
        if (existing && !cancelled) {
          const found = await verseRepo.getById(existing.verseId);
          setVerse(found);
          setLoading(false);
          return;
        }

        // Get recent verse IDs to exclude
        const recentEntries = await dailyRepo.getRecent(DAILY_VERSE_EXCLUSION_WINDOW) as DailyVerse[];
        const recentIds = new Set(recentEntries.map((e: DailyVerse) => e.verseId));

        // Get all verses and pick one not recently shown
        const allVerses = await verseRepo.getAll() as BibleVerse[];
        const candidates = allVerses.filter((v: BibleVerse) => !recentIds.has(v.id));

        // If all have been shown recently, pick from all
        const pool = candidates.length > 0 ? candidates : allVerses;

        if (pool.length === 0) {
          if (!cancelled) {
            setVerse(null);
            setLoading(false);
          }
          return;
        }

        const selected = pool[Math.floor(Math.random() * pool.length)];

        // Save today's daily verse
        await dailyRepo.save(selected.id, today);

        if (!cancelled) {
          setVerse(selected);
          setLoading(false);
        }
      } catch (error) {
        console.error('useDailyVerse error:', error);
        if (!cancelled) {
          setVerse(null);
          setLoading(false);
        }
      }
    }

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [db]);

  return { verse, loading };
}
