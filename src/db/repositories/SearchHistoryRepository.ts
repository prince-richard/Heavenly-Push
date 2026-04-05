import type { SQLiteDatabase } from 'expo-sqlite';
import type { SearchHistoryItem } from '../../types/models';
import { generateId } from '../../utils/id';

interface SearchHistoryRow {
  id: string;
  query: string;
  language: string;
  created_at: string;
}

function rowToItem(row: SearchHistoryRow): SearchHistoryItem {
  return {
    id: row.id,
    query: row.query,
    language: row.language as SearchHistoryItem['language'],
    createdAt: row.created_at,
  };
}

export class SearchHistoryRepository {
  constructor(private db: SQLiteDatabase) {}

  add(query: string, language: string): void {
    this.db.runSync(
      'INSERT INTO search_history (id, query, language, created_at) VALUES (?, ?, ?, ?)',
      [generateId(), query, language, new Date().toISOString()],
    );
  }

  getRecent(limit: number): SearchHistoryItem[] {
    const rows = this.db.getAllSync<SearchHistoryRow>(
      'SELECT * FROM search_history ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToItem);
  }

  clear(): void {
    this.db.runSync('DELETE FROM search_history');
  }
}
