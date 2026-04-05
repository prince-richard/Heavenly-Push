import type { SQLiteDatabase } from 'expo-sqlite';
import versesEn from '../data/seed/verses-en.json';
import versesTa from '../data/seed/verses-ta.json';

interface SeedVerseEn {
  id: string;
  translationId: string;
  bookCode: string;
  bookNameEn: string;
  bookNameTa: string;
  chapter: number;
  verse: number;
  textEn: string;
  keywordsEn: string[];
  themeTags: string[];
}

interface SeedVerseTa {
  id: string;
  textTa: string;
  keywordsTa: string[];
}

/**
 * Seeds the verses table if it's empty.
 * Merges English and Tamil data by verse ID.
 */
export async function seedVerses(db: SQLiteDatabase): Promise<void> {
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM verses',
  );

  if (count && count.cnt > 0) {
    return; // Already seeded
  }

  // Build Tamil lookup
  const taMap = new Map<string, SeedVerseTa>();
  for (const ta of versesTa as SeedVerseTa[]) {
    taMap.set(ta.id, ta);
  }

  const stmt = await db.prepareAsync(
    `INSERT INTO verses (id, translation_id, book_code, book_name_en, book_name_ta, chapter, verse, text_en, text_ta, transliteration_ta, theme_tags, keywords_en, keywords_ta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  try {
    await db.execAsync('BEGIN TRANSACTION');

    for (const en of versesEn as SeedVerseEn[]) {
      const ta = taMap.get(en.id);

      await stmt.executeAsync([
        en.id,
        en.translationId,
        en.bookCode,
        en.bookNameEn,
        en.bookNameTa,
        en.chapter,
        en.verse,
        en.textEn,
        ta?.textTa ?? null,
        null, // transliteration_ta
        JSON.stringify(en.themeTags),
        JSON.stringify(en.keywordsEn),
        JSON.stringify(ta?.keywordsTa ?? []),
      ]);
    }

    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  } finally {
    await stmt.finalizeAsync();
  }
}
