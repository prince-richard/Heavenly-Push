import type { SQLiteDatabase } from 'expo-sqlite';
import type { DailyVerse } from '../../types/models';
import { generateId } from '../../utils/id';

interface DailyVerseRow {
  id: string;
  verse_id: string;
  date: string;
}

function rowToDailyVerse(row: DailyVerseRow): DailyVerse {
  return {
    id: row.id,
    verseId: row.verse_id,
    date: row.date,
  };
}

export class DailyVerseRepository {
  constructor(private db: SQLiteDatabase) {}

  async getByDate(date: string): Promise<DailyVerse | null> {
    const row = await this.db.getFirstAsync<DailyVerseRow>(
      'SELECT * FROM daily_verses WHERE date = ?',
      [date],
    );
    return row ? rowToDailyVerse(row) : null;
  }

  async save(verseId: string, date: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO daily_verses (id, verse_id, date) VALUES (?, ?, ?)',
      [generateId(), verseId, date],
    );
  }

  async getRecent(count: number): Promise<DailyVerse[]> {
    const rows = await this.db.getAllAsync<DailyVerseRow>(
      'SELECT * FROM daily_verses ORDER BY date DESC LIMIT ?',
      [count],
    );
    return rows.map(rowToDailyVerse);
  }
}
