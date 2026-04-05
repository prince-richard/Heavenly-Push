import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedVerses } from './seed';

const DB_NAME = 'heavenly-push.db';

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
  // Enable WAL mode for better concurrent read performance
  await dbInstance.execAsync('PRAGMA journal_mode = WAL');

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
