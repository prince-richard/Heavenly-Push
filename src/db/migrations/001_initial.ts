import type { SQLiteDatabase } from 'expo-sqlite';

export async function up(db: SQLiteDatabase): Promise<void> {
  // Verses table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS verses (
      id TEXT PRIMARY KEY,
      translation_id TEXT NOT NULL,
      book_code TEXT NOT NULL,
      book_name_en TEXT NOT NULL,
      book_name_ta TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text_en TEXT,
      text_ta TEXT,
      transliteration_ta TEXT,
      theme_tags TEXT NOT NULL,
      keywords_en TEXT NOT NULL,
      keywords_ta TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_verses_ref ON verses(book_code, chapter, verse);
  `);

  // FTS5 virtual table
  await db.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
      text_en, text_ta, keywords_en, keywords_ta, theme_tags,
      content=verses, content_rowid=rowid
    );
  `);

  // Sync triggers for FTS
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
      INSERT INTO verses_fts(rowid, text_en, text_ta, keywords_en, keywords_ta, theme_tags)
      VALUES (new.rowid, new.text_en, new.text_ta, new.keywords_en, new.keywords_ta, new.theme_tags);
    END;
  `);

  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
      INSERT INTO verses_fts(verses_fts, rowid, text_en, text_ta, keywords_en, keywords_ta, theme_tags)
      VALUES ('delete', old.rowid, old.text_en, old.text_ta, old.keywords_en, old.keywords_ta, old.theme_tags);
    END;
  `);

  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
      INSERT INTO verses_fts(verses_fts, rowid, text_en, text_ta, keywords_en, keywords_ta, theme_tags)
      VALUES ('delete', old.rowid, old.text_en, old.text_ta, old.keywords_en, old.keywords_ta, old.theme_tags);
      INSERT INTO verses_fts(rowid, text_en, text_ta, keywords_en, keywords_ta, theme_tags)
      VALUES (new.rowid, new.text_en, new.text_ta, new.keywords_en, new.keywords_ta, new.theme_tags);
    END;
  `);

  // Favorites table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      verse_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      custom_tag TEXT
    );
  `);

  // Settings table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Reflections table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reflections (
      note_id TEXT PRIMARY KEY,
      verse_id TEXT NOT NULL,
      audio_file_uri TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Search history table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      language TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Audio plans table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS audio_plans (
      plan_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    );
  `);

  // Daily verses table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_verses (
      id TEXT PRIMARY KEY,
      verse_id TEXT NOT NULL,
      date TEXT NOT NULL UNIQUE
    );
  `);
}
