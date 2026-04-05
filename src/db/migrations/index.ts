import type { SQLiteDatabase } from 'expo-sqlite';
import { up as migration001 } from './001_initial';

interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => void;
}

const migrations: Migration[] = [
  { version: 1, up: migration001 },
];

/**
 * Runs all pending migrations based on PRAGMA user_version.
 * Returns the final version number.
 */
export function runMigrations(db: SQLiteDatabase): number {
  const result = db.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let currentVersion = result?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migration.up(db);
      db.execSync(`PRAGMA user_version = ${migration.version}`);
      currentVersion = migration.version;
    }
  }

  return currentVersion;
}
