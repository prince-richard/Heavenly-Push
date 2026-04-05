import type { SQLiteDatabase } from 'expo-sqlite';
import type { AudioPlan } from '../../types/models';

interface PlanRow {
  plan_id: string;
  payload: string;
}

function rowToPlan(row: PlanRow): AudioPlan {
  return JSON.parse(row.payload) as AudioPlan;
}

export class PlanRepository {
  constructor(private db: SQLiteDatabase) {}

  getAll(): AudioPlan[] {
    const rows = this.db.getAllSync<PlanRow>(
      'SELECT * FROM audio_plans ORDER BY plan_id',
    );
    return rows.map(rowToPlan);
  }

  getById(planId: string): AudioPlan | null {
    const row = this.db.getFirstSync<PlanRow>(
      'SELECT * FROM audio_plans WHERE plan_id = ?',
      [planId],
    );
    return row ? rowToPlan(row) : null;
  }

  save(plan: AudioPlan): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO audio_plans (plan_id, payload) VALUES (?, ?)',
      [plan.planId, JSON.stringify(plan)],
    );
  }

  updateProgress(planId: string, currentDay: number): void {
    const plan = this.getById(planId);
    if (!plan) return;

    plan.currentDay = currentDay;
    plan.completed = currentDay >= plan.totalDays;
    this.save(plan);
  }
}
