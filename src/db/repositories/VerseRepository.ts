import type { SQLiteDatabase } from 'expo-sqlite';
import type { BibleVerse, SupportedLanguage } from '../../types/models';

interface VerseRow {
  id: string;
  translation_id: string;
  book_code: string;
  book_name_en: string;
  book_name_ta: string;
  chapter: number;
  verse: number;
  text_en: string | null;
  text_ta: string | null;
  transliteration_ta: string | null;
  theme_tags: string;
  keywords_en: string;
  keywords_ta: string;
}

function rowToVerse(row: VerseRow): BibleVerse {
  return {
    id: row.id,
    translationId: row.translation_id,
    bookCode: row.book_code,
    bookNameEn: row.book_name_en,
    bookNameTa: row.book_name_ta,
    chapter: row.chapter,
    verse: row.verse,
    textEn: row.text_en ?? undefined,
    textTa: row.text_ta ?? undefined,
    transliterationTa: row.transliteration_ta ?? undefined,
    themeTags: JSON.parse(row.theme_tags) as string[],
    keywordsEn: JSON.parse(row.keywords_en) as string[],
    keywordsTa: JSON.parse(row.keywords_ta) as string[],
  };
}

export class VerseRepository {
  constructor(private db: SQLiteDatabase) {}

  async getById(id: string): Promise<BibleVerse | null> {
    const row = await this.db.getFirstAsync<VerseRow>(
      'SELECT * FROM verses WHERE id = ?',
      [id],
    );
    return row ? rowToVerse(row) : null;
  }

  async getByReference(
    bookCode: string,
    chapter: number,
    verse?: number,
  ): Promise<BibleVerse[]> {
    if (verse !== undefined) {
      const rows = await this.db.getAllAsync<VerseRow>(
        'SELECT * FROM verses WHERE book_code = ? AND chapter = ? AND verse = ?',
        [bookCode, chapter, verse],
      );
      return rows.map(rowToVerse);
    }

    const rows = await this.db.getAllAsync<VerseRow>(
      'SELECT * FROM verses WHERE book_code = ? AND chapter = ? ORDER BY verse',
      [bookCode, chapter],
    );
    return rows.map(rowToVerse);
  }

  /**
   * Returns surrounding verses for context.
   * @param verseId The center verse ID
   * @param range Number of verses before and after to include
   */
  async getContext(verseId: string, range: number): Promise<BibleVerse[]> {
    const center = await this.getById(verseId);
    if (!center) return [];

    const minVerse = center.verse - range;
    const maxVerse = center.verse + range;

    const rows = await this.db.getAllAsync<VerseRow>(
      `SELECT * FROM verses
       WHERE book_code = ? AND chapter = ? AND verse >= ? AND verse <= ?
       ORDER BY verse`,
      [center.bookCode, center.chapter, minVerse, maxVerse],
    );
    return rows.map(rowToVerse);
  }

  /**
   * Full-text search using FTS5.
   * @param query The search query
   * @param language Optional language filter
   */
  async searchFTS(query: string, language?: SupportedLanguage): Promise<BibleVerse[]> {
    // Escape FTS5 special characters
    const sanitized = query.replace(/['"]/g, '').trim();
    if (!sanitized) return [];

    // Build the FTS query based on language
    let ftsQuery: string;
    if (language === 'en') {
      ftsQuery = `{text_en keywords_en}: "${sanitized}"`;
    } else if (language === 'ta') {
      ftsQuery = `{text_ta keywords_ta}: "${sanitized}"`;
    } else {
      ftsQuery = `"${sanitized}"`;
    }

    try {
      const rows = await this.db.getAllAsync<VerseRow>(
        `SELECT v.* FROM verses v
         JOIN verses_fts fts ON v.rowid = fts.rowid
         WHERE verses_fts MATCH ?
         ORDER BY rank
         LIMIT 20`,
        [ftsQuery],
      );
      return rows.map(rowToVerse);
    } catch {
      // If FTS query fails (e.g., syntax issue), fall back to LIKE
      return this.searchLike(sanitized, language);
    }
  }

  /**
   * Fallback search using LIKE when FTS fails.
   */
  private async searchLike(
    query: string,
    language?: SupportedLanguage,
  ): Promise<BibleVerse[]> {
    const pattern = `%${query}%`;

    if (language === 'en') {
      const rows = await this.db.getAllAsync<VerseRow>(
        'SELECT * FROM verses WHERE text_en LIKE ? OR keywords_en LIKE ? LIMIT 20',
        [pattern, pattern],
      );
      return rows.map(rowToVerse);
    }

    if (language === 'ta') {
      const rows = await this.db.getAllAsync<VerseRow>(
        'SELECT * FROM verses WHERE text_ta LIKE ? OR keywords_ta LIKE ? LIMIT 20',
        [pattern, pattern],
      );
      return rows.map(rowToVerse);
    }

    const rows = await this.db.getAllAsync<VerseRow>(
      `SELECT * FROM verses
       WHERE text_en LIKE ? OR text_ta LIKE ? OR keywords_en LIKE ? OR keywords_ta LIKE ? OR theme_tags LIKE ?
       LIMIT 20`,
      [pattern, pattern, pattern, pattern, pattern],
    );
    return rows.map(rowToVerse);
  }

  /**
   * Search by theme tags.
   */
  async searchByThemes(themes: string[]): Promise<BibleVerse[]> {
    if (themes.length === 0) return [];

    const conditions = themes.map(() => 'theme_tags LIKE ?').join(' OR ');
    const params = themes.map((t) => `%"${t}"%`);

    const rows = await this.db.getAllAsync<VerseRow>(
      `SELECT * FROM verses WHERE ${conditions} LIMIT 20`,
      params,
    );
    return rows.map(rowToVerse);
  }

  /**
   * Returns a random verse, optionally excluding specific IDs.
   */
  async getRandom(excludeIds?: string[]): Promise<BibleVerse | null> {
    if (excludeIds && excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      const row = await this.db.getFirstAsync<VerseRow>(
        `SELECT * FROM verses WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`,
        excludeIds,
      );
      return row ? rowToVerse(row) : null;
    }

    const row = await this.db.getFirstAsync<VerseRow>(
      'SELECT * FROM verses ORDER BY RANDOM() LIMIT 1',
    );
    return row ? rowToVerse(row) : null;
  }

  async getAll(): Promise<BibleVerse[]> {
    const rows = await this.db.getAllAsync<VerseRow>(
      'SELECT * FROM verses ORDER BY book_code, chapter, verse',
    );
    return rows.map(rowToVerse);
  }

  async count(): Promise<number> {
    const result = await this.db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM verses',
    );
    return result?.cnt ?? 0;
  }
}
