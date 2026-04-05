import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedVerses } from './seed';

// v2: renamed to avoid corrupted DB from earlier FTS5 crash on web
const DB_NAME = 'heavenly-push-v2.db';

let dbInstance: SQLiteDatabase | null = null;

/**
 * Returns the singleton SQLite database instance (async).
 * On first call, opens the database, runs migrations, and seeds data.
 */
export async function initializeDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance !== null) {
    return dbInstance;
  }

  dbInstance = await openDatabaseAsync(DB_NAME);

  // Enable WAL mode — may not be supported on web (wa-sqlite)
  try {
    await dbInstance.execAsync('PRAGMA journal_mode = WAL');
  } catch {
    console.log('[DB] WAL mode not available, using default journal mode');
  }

  await runMigrations(dbInstance);
  await seedVerses(dbInstance);

  return dbInstance;
}

/**
 * Returns the already-initialized database instance.
 * Throws if called before initializeDatabase().
 */
export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Ensure DatabaseProvider has mounted.');
  }
  return dbInstance;
}
