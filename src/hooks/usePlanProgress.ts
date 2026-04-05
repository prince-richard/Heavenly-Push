import { useState, useEffect, useCallback } from 'react';
import type { AudioPlan, BibleVerse } from '@/types/models';
import { useDatabase } from '@/contexts/DatabaseContext';
import { PlanRepository } from '@/db/repositories/PlanRepository';
import { VerseRepository } from '@/db/repositories/VerseRepository';
import defaultPlans from '@/data/plans/default-plans.json';

interface PlanProgressResult {
  plan: AudioPlan | null;
  currentDayVerses: BibleVerse[];
  progress: number;
  markDayComplete: () => void;
  loading: boolean;
}

export function usePlanProgress(planId: string): PlanProgressResult {
  const db = useDatabase();
  const [plan, setPlan] = useState<AudioPlan | null>(null);
  const [currentDayVerses, setCurrentDayVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const planRepo = new PlanRepository(db);
      const verseRepo = new VerseRepository(db);

      let loaded = await planRepo.getById(planId);
      // Fallback to JSON if not in DB yet
      if (!loaded) {
        const jsonPlan = (defaultPlans as AudioPlan[]).find(p => p.planId === planId);
        if (jsonPlan) {
          // Save to DB for persistence
          await planRepo.save(jsonPlan);
          loaded = jsonPlan;
        }
      }
      setPlan(loaded);

      if (loaded && loaded.currentDay <= loaded.totalDays) {
        // dailyVerses is 0-indexed, currentDay is 1-indexed
        const dayIndex = loaded.currentDay - 1;
        const verseIds: string[] = loaded.dailyVerses[dayIndex] ?? [];
        const verses: BibleVerse[] = [];
        for (const id of verseIds) {
          const v = await verseRepo.getById(id);
          if (v) verses.push(v);
        }
        setCurrentDayVerses(verses);
      } else {
        setCurrentDayVerses([]);
      }
    } catch (error) {
      console.error('usePlanProgress error:', error);
      setPlan(null);
      setCurrentDayVerses([]);
    } finally {
      setLoading(false);
    }
  }, [db, planId]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const progress = plan
    ? plan.completed
      ? 100
      : Math.round(((plan.currentDay - 1) / plan.totalDays) * 100)
    : 0;

  const markDayComplete = useCallback(() => {
    if (!plan) return;

    async function doMark() {
      try {
        const planRepo = new PlanRepository(db);

        const nextDay = plan!.currentDay + 1;
        const isCompleted = nextDay > plan!.totalDays;

        await planRepo.updateProgress(plan!.planId, nextDay);

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
        await loadPlan();
      } catch (error) {
        console.error('markDayComplete error:', error);
      }
    }

    void doMark();
  }, [db, plan, loadPlan]);

  return {
    plan,
    currentDayVerses,
    progress,
    markDayComplete,
    loading,
  };
}
