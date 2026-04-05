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

  getByDate(date: string): DailyVerse | null {
    const row = this.db.getFirstSync<DailyVerseRow>(
      'SELECT * FROM daily_verses WHERE date = ?',
      [date],
    );
    return row ? rowToDailyVerse(row) : null;
  }

  save(verseId: string, date: string): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO daily_verses (id, verse_id, date) VALUES (?, ?, ?)',
      [generateId(), verseId, date],
    );
  }

  getRecent(count: number): DailyVerse[] {
    const rows = this.db.getAllSync<DailyVerseRow>(
      'SELECT * FROM daily_verses ORDER BY date DESC LIMIT ?',
      [count],
    );
    return rows.map(rowToDailyVerse);
  }
}
