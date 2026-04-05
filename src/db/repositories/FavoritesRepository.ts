import type { SQLiteDatabase } from 'expo-sqlite';
import type { FavoriteVerse } from '../../types/models';
import { generateId } from '../../utils/id';

interface FavoriteRow {
  id: string;
  verse_id: string;
  created_at: string;
  custom_tag: string | null;
}

function rowToFavorite(row: FavoriteRow): FavoriteVerse {
  return {
    id: row.id,
    verseId: row.verse_id,
    createdAt: row.created_at,
    customTag: row.custom_tag ?? undefined,
  };
}

export class FavoritesRepository {
  constructor(private db: SQLiteDatabase) {}

  async add(verseId: string): Promise<void> {
    const already = await this.isFavorite(verseId);
    if (already) return;

    await this.db.runAsync(
      'INSERT INTO favorites (id, verse_id, created_at) VALUES (?, ?, ?)',
      [generateId(), verseId, new Date().toISOString()],
    );
  }

  async remove(verseId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM favorites WHERE verse_id = ?', [verseId]);
  }

  async getAll(): Promise<FavoriteVerse[]> {
    const rows = await this.db.getAllAsync<FavoriteRow>(
      'SELECT * FROM favorites ORDER BY created_at DESC',
    );
    return rows.map(rowToFavorite);
  }

  async isFavorite(verseId: string): Promise<boolean> {
    const row = await this.db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM favorites WHERE verse_id = ?',
      [verseId],
    );
    return (row?.cnt ?? 0) > 0;
  }
}
