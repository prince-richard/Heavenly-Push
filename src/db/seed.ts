import type { SQLiteDatabase } from 'expo-sqlite';
import versesEn from '../data/seed/verses-en.json';
import versesTa from '../data/seed/verses-ta.json';
import defaultPlans from '../data/plans/default-plans.json';
import type { AudioPlan } from '../types/models';

const CURRENT_SEED_VERSION = 2;

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
 * Seeds the verses table using INSERT OR REPLACE (upsert).
 * Checks a seed_version in the settings table to decide if re-seeding is needed.
 */
export async function seedVerses(db: SQLiteDatabase): Promise<void> {
  // Check seed version
  const versionRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'seed_version'",
  );
  const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

  if (currentVersion >= CURRENT_SEED_VERSION) {
    return; // Already at current version
  }

  // Build Tamil lookup
  const taMap = new Map<string, SeedVerseTa>();
  for (const ta of versesTa as SeedVerseTa[]) {
    taMap.set(ta.id, ta);
  }

  const stmt = await db.prepareAsync(
    `INSERT OR REPLACE INTO verses (id, translation_id, book_code, book_name_en, book_name_ta, chapter, verse, text_en, text_ta, transliteration_ta, theme_tags, keywords_en, keywords_ta)
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
    console.log(`[DB] Seeded ${(versesEn as SeedVerseEn[]).length} verses (v${CURRENT_SEED_VERSION})`);
  } catch (error) {
    try { await db.execAsync('ROLLBACK'); } catch { /* ignore */ }
    throw error;
  } finally {
    await stmt.finalizeAsync();
  }

  // Update seed version
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('seed_version', ?)",
    [String(CURRENT_SEED_VERSION)],
  );

  // Seed default plans
  await seedPlans(db);
}

/**
 * Seeds the audio_plans table with default plans if empty.
 */
async function seedPlans(db: SQLiteDatabase): Promise<void> {
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM audio_plans',
  );

  if (count && count.cnt > 0) return;

  const stmt = await db.prepareAsync(
    'INSERT INTO audio_plans (plan_id, payload) VALUES (?, ?)',
  );

  try {
    for (const plan of defaultPlans as AudioPlan[]) {
      await stmt.executeAsync([plan.planId, JSON.stringify(plan)]);
    }
    console.log(`[DB] Seeded ${(defaultPlans as AudioPlan[]).length} plans`);
  } finally {
    await stmt.finalizeAsync();
  }
}
