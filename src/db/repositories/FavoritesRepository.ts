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

  add(verseId: string): void {
    if (this.isFavorite(verseId)) return;

    this.db.runSync(
      'INSERT INTO favorites (id, verse_id, created_at) VALUES (?, ?, ?)',
      [generateId(), verseId, new Date().toISOString()],
    );
  }

  remove(verseId: string): void {
    this.db.runSync('DELETE FROM favorites WHERE verse_id = ?', [verseId]);
  }

  getAll(): FavoriteVerse[] {
    const rows = this.db.getAllSync<FavoriteRow>(
      'SELECT * FROM favorites ORDER BY created_at DESC',
    );
    return rows.map(rowToFavorite);
  }

  isFavorite(verseId: string): boolean {
    const row = this.db.getFirstSync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM favorites WHERE verse_id = ?',
      [verseId],
    );
    return (row?.cnt ?? 0) > 0;
  }
}
