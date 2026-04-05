import type { SQLiteDatabase } from 'expo-sqlite';

interface SettingRow {
  key: string;
  value: string;
}

export class SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  get(key: string): string | null {
    const row = this.db.getFirstSync<SettingRow>(
      'SELECT * FROM settings WHERE key = ?',
      [key],
    );
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value],
    );
  }

  getAll(): Record<string, string> {
    const rows = this.db.getAllSync<SettingRow>('SELECT * FROM settings');
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }
}
