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

  async add(query: string, language: string): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO search_history (id, query, language, created_at) VALUES (?, ?, ?, ?)',
      [generateId(), query, language, new Date().toISOString()],
    );
  }

  async getRecent(limit: number): Promise<SearchHistoryItem[]> {
    const rows = await this.db.getAllAsync<SearchHistoryRow>(
      'SELECT * FROM search_history ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return rows.map(rowToItem);
  }

  async clear(): Promise<void> {
    await this.db.runAsync('DELETE FROM search_history');
  }
}
