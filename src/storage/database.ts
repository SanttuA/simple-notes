import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

let databasePromise: Promise<SQLiteDatabase> | null = null;

type UserVersionRow = {
  user_version: number;
};

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('simple_notes.db').then(async (database) => {
      await migrateDatabase(database);
      return database;
    });
  }

  return databasePromise;
}

export async function migrateDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);

  const versionRow = await database.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await database.withTransactionAsync(async () => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          body TEXT NOT NULL DEFAULT '',
          type TEXT NOT NULL CHECK(type IN ('text', 'checklist')),
          color TEXT NOT NULL DEFAULT 'default',
          is_pinned INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          archived_at INTEGER,
          trashed_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS checklist_items (
          id TEXT PRIMARY KEY NOT NULL,
          note_id TEXT NOT NULL,
          text TEXT NOT NULL DEFAULT '',
          is_checked INTEGER NOT NULL DEFAULT 0,
          position INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS checklist_items_note_id_position_idx
          ON checklist_items(note_id, position);

        CREATE TABLE IF NOT EXISTS labels (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL COLLATE NOCASE UNIQUE,
          color TEXT NOT NULL DEFAULT 'slate',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS note_labels (
          note_id TEXT NOT NULL,
          label_id TEXT NOT NULL,
          PRIMARY KEY(note_id, label_id),
          FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
          FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS notes_status_updated_idx
          ON notes(trashed_at, archived_at, is_pinned, updated_at);

        PRAGMA user_version = 1;
      `);
    });
  }
}
