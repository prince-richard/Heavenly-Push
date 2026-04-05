import type { SQLiteDatabase } from 'expo-sqlite';

interface SettingRow {
  key: string;
  value: string;
}

export class SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<SettingRow>(
      'SELECT * FROM settings WHERE key = ?',
      [key],
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value],
    );
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.getAllAsync<SettingRow>('SELECT * FROM settings');
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }
}
