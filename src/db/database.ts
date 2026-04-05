import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedVerses } from './seed';

const DB_NAME = 'heavenly-push.db';

let dbInstance: SQLiteDatabase | null = null;
let initialized = false;

/**
 * Returns the singleton SQLite database instance.
 * On first call, opens the database, runs migrations, and seeds data.
 */
export function getDatabase(): SQLiteDatabase {
  if (dbInstance === null) {
    dbInstance = openDatabaseSync(DB_NAME);
    // Enable WAL mode for better concurrent read performance
    dbInstance.execSync('PRAGMA journal_mode = WAL');
  }

  if (!initialized) {
    initialized = true;
    runMigrations(dbInstance);
    seedVerses(dbInstance);
  }

  return dbInstance;
}
