import { useState, useEffect, useCallback } from 'react';
import type { AudioPlan, BibleVerse } from '@/types/models';
import { getDatabase } from '@/db/database';
import { PlanRepository } from '@/db/repositories/PlanRepository';
import { VerseRepository } from '@/db/repositories/VerseRepository';

interface PlanProgressResult {
  plan: AudioPlan | null;
  currentDayVerses: BibleVerse[];
  progress: number;
  markDayComplete: () => void;
  loading: boolean;
}

export function usePlanProgress(planId: string): PlanProgressResult {
  const [plan, setPlan] = useState<AudioPlan | null>(null);
  const [currentDayVerses, setCurrentDayVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      const planRepo = new PlanRepository(db);
      const verseRepo = new VerseRepository(db);

      const loaded = planRepo.getById(planId);
      setPlan(loaded);

      if (loaded && loaded.currentDay <= loaded.totalDays) {
        // dailyVerses is 0-indexed, currentDay is 1-indexed
        const dayIndex = loaded.currentDay - 1;
        const verseIds: string[] = loaded.dailyVerses[dayIndex] ?? [];
        const verses = verseIds
          .map((id: string) => verseRepo.getById(id))
          .filter((v: BibleVerse | null): v is BibleVerse => v !== null);
        setCurrentDayVerses(verses);
      } else {
        setCurrentDayVerses([]);
      }
    } catch {
      setPlan(null);
      setCurrentDayVerses([]);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const progress = plan
    ? plan.completed
      ? 100
      : Math.round(((plan.currentDay - 1) / plan.totalDays) * 100)
    : 0;

  const markDayComplete = useCallback(() => {
    if (!plan) return;

    try {
      const db = getDatabase();
      const planRepo = new PlanRepository(db);

      const nextDay = plan.currentDay + 1;
      const isCompleted = nextDay > plan.totalDays;

      planRepo.updateProgress(plan.planId, nextDay);

      setPlan((prev) =>
        prev
          ? {
              ...prev,
              currentDay: nextDay,
              completed: isCompleted,
            }
          : null
      );

      // Reload verses for the new day
      loadPlan();
    } catch {
      // Silently fail — the UI still shows the current state
    }
  }, [plan, loadPlan]);

  return {
    plan,
    currentDayVerses,
    progress,
    markDayComplete,
    loading,
  };
}
