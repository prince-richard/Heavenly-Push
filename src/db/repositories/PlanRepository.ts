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

  async getAll(): Promise<AudioPlan[]> {
    const rows = await this.db.getAllAsync<PlanRow>(
      'SELECT * FROM audio_plans ORDER BY plan_id',
    );
    return rows.map(rowToPlan);
  }

  async getById(planId: string): Promise<AudioPlan | null> {
    const row = await this.db.getFirstAsync<PlanRow>(
      'SELECT * FROM audio_plans WHERE plan_id = ?',
      [planId],
    );
    return row ? rowToPlan(row) : null;
  }

  async save(plan: AudioPlan): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO audio_plans (plan_id, payload) VALUES (?, ?)',
      [plan.planId, JSON.stringify(plan)],
    );
  }

  async updateProgress(planId: string, currentDay: number): Promise<void> {
    const plan = await this.getById(planId);
    if (!plan) return;

    plan.currentDay = currentDay;
    plan.completed = currentDay >= plan.totalDays;
    await this.save(plan);
  }
}
