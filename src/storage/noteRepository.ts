import type { SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/domain/ids';
import { normalizeLabelNames } from '@/domain/noteFilters';
import type {
  AppSettings,
  ChecklistItem,
  Label,
  Note,
  NoteColor,
  NoteDraft,
  NoteStatus,
} from '@/types/notes';

type NoteRow = {
  id: string;
  title: string;
  body: string;
  type: Note['type'];
  color: NoteColor;
  is_pinned: number;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
  trashed_at: number | null;
};

type ChecklistItemRow = {
  id: string;
  note_id: string;
  text: string;
  is_checked: number;
  position: number;
  created_at: number;
  updated_at: number;
};

type LabelRow = {
  id: string;
  name: string;
  color: NoteColor;
  created_at: number;
  updated_at: number;
};

type NoteLabelRow = LabelRow & {
  note_id: string;
};

type SettingRow = {
  key: keyof AppSettings;
  value: string;
};

const DEFAULT_SETTINGS: AppSettings = {
  gridView: true,
  biometricLockEnabled: false,
  lockAfterSeconds: 30,
};

export type NoteRepository = ReturnType<typeof createNoteRepository>;

export function createNoteRepository(database: SQLiteDatabase) {
  return {
    async listNotes(status: NoteStatus | 'all' = 'all') {
      const where = statusWhere(status);
      const rows = await database.getAllAsync<NoteRow>(
        `SELECT * FROM notes ${where} ORDER BY is_pinned DESC, updated_at DESC`,
      );

      return hydrateNotes(database, rows);
    },

    async getNote(id: string) {
      const row = await database.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
      if (!row) {
        return null;
      }

      const notes = await hydrateNotes(database, [row]);
      return notes[0] ?? null;
    },

    async saveNote(draft: NoteDraft) {
      const noteId = draft.id ?? createId('note');
      const now = Date.now();
      const labelNames = normalizeLabelNames(draft.labelNames);

      await database.withTransactionAsync(async () => {
        const existing = await database.getFirstAsync<{ id: string }>(
          'SELECT id FROM notes WHERE id = ?',
          noteId,
        );

        if (existing) {
          await database.runAsync(
            `UPDATE notes
             SET title = ?, body = ?, type = ?, color = ?, is_pinned = ?, updated_at = ?
             WHERE id = ?`,
            [
              draft.title.trim(),
              draft.body,
              draft.type,
              draft.color,
              draft.isPinned ? 1 : 0,
              now,
              noteId,
            ],
          );
        } else {
          await database.runAsync(
            `INSERT INTO notes
              (id, title, body, type, color, is_pinned, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              noteId,
              draft.title.trim(),
              draft.body,
              draft.type,
              draft.color,
              draft.isPinned ? 1 : 0,
              now,
              now,
            ],
          );
        }

        await database.runAsync('DELETE FROM checklist_items WHERE note_id = ?', noteId);

        if (draft.type === 'checklist') {
          for (const [position, item] of draft.checklistItems.entries()) {
            const text = item.text.trim();
            if (text.length === 0) {
              continue;
            }

            const itemId = item.id ?? createId('item');
            await database.runAsync(
              `INSERT INTO checklist_items
                (id, note_id, text, is_checked, position, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [itemId, noteId, text, item.isChecked ? 1 : 0, position, now, now],
            );
          }
        }

        await database.runAsync('DELETE FROM note_labels WHERE note_id = ?', noteId);

        for (const labelName of labelNames) {
          const label = await ensureLabel(database, labelName, now);
          await database.runAsync(
            'INSERT OR IGNORE INTO note_labels (note_id, label_id) VALUES (?, ?)',
            [noteId, label.id],
          );
        }
      });

      const saved = await this.getNote(noteId);
      if (!saved) {
        throw new Error('Note could not be loaded after save.');
      }

      return saved;
    },

    async togglePinned(id: string) {
      const now = Date.now();
      await database.runAsync(
        `UPDATE notes
         SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END, updated_at = ?
         WHERE id = ? AND trashed_at IS NULL`,
        [now, id],
      );
    },

    async archiveNote(id: string) {
      const now = Date.now();
      await database.runAsync(
        `UPDATE notes
         SET archived_at = ?, trashed_at = NULL, updated_at = ?
         WHERE id = ? AND trashed_at IS NULL`,
        [now, now, id],
      );
    },

    async trashNote(id: string) {
      const now = Date.now();
      await database.runAsync(
        `UPDATE notes
         SET trashed_at = ?, archived_at = NULL, updated_at = ?
         WHERE id = ?`,
        [now, now, id],
      );
    },

    async restoreNote(id: string) {
      const now = Date.now();
      await database.runAsync(
        `UPDATE notes
         SET archived_at = NULL, trashed_at = NULL, updated_at = ?
         WHERE id = ?`,
        [now, id],
      );
    },

    async deleteNotePermanently(id: string) {
      const result = await database.runAsync(
        'DELETE FROM notes WHERE id = ? AND trashed_at IS NOT NULL',
        id,
      );
      return result.changes > 0;
    },

    async listLabels() {
      const rows = await database.getAllAsync<LabelRow>(
        'SELECT * FROM labels ORDER BY lower(name) ASC',
      );
      return rows.map(mapLabel);
    },

    async getSettings() {
      const rows = await database.getAllAsync<SettingRow>('SELECT key, value FROM settings');
      return rows.reduce<AppSettings>(
        (settings, row) => ({
          ...settings,
          [row.key]: parseSetting(row.key, row.value),
        }),
        DEFAULT_SETTINGS,
      );
    },

    async setSetting<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) {
      await database.runAsync(
        `INSERT INTO settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, serializeSetting(value)],
      );
    },
  };
}

function statusWhere(status: NoteStatus | 'all') {
  switch (status) {
    case 'active':
      return 'WHERE trashed_at IS NULL AND archived_at IS NULL';
    case 'archived':
      return 'WHERE trashed_at IS NULL AND archived_at IS NOT NULL';
    case 'trashed':
      return 'WHERE trashed_at IS NOT NULL';
    case 'all':
      return '';
  }
}

async function hydrateNotes(database: SQLiteDatabase, rows: NoteRow[]) {
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');

  const [checklistRows, labelRows] = await Promise.all([
    database.getAllAsync<ChecklistItemRow>(
      `SELECT * FROM checklist_items
       WHERE note_id IN (${placeholders})
       ORDER BY position ASC`,
      ids,
    ),
    database.getAllAsync<NoteLabelRow>(
      `SELECT note_labels.note_id, labels.*
       FROM note_labels
       INNER JOIN labels ON labels.id = note_labels.label_id
       WHERE note_labels.note_id IN (${placeholders})
       ORDER BY lower(labels.name) ASC`,
      ids,
    ),
  ]);

  const itemsByNote = new Map<string, ChecklistItem[]>();
  for (const row of checklistRows) {
    const current = itemsByNote.get(row.note_id) ?? [];
    current.push(mapChecklistItem(row));
    itemsByNote.set(row.note_id, current);
  }

  const labelsByNote = new Map<string, Label[]>();
  for (const row of labelRows) {
    const current = labelsByNote.get(row.note_id) ?? [];
    current.push(mapLabel(row));
    labelsByNote.set(row.note_id, current);
  }

  return rows.map((row) =>
    mapNote(row, itemsByNote.get(row.id) ?? [], labelsByNote.get(row.id) ?? []),
  );
}

async function ensureLabel(database: SQLiteDatabase, name: string, now: number) {
  const existing = await database.getFirstAsync<LabelRow>(
    'SELECT * FROM labels WHERE name = ? COLLATE NOCASE',
    name,
  );

  if (existing) {
    return mapLabel(existing);
  }

  const label: Label = {
    id: createId('label'),
    name,
    color: 'slate',
    createdAt: now,
    updatedAt: now,
  };

  await database.runAsync(
    `INSERT INTO labels (id, name, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [label.id, label.name, label.color, label.createdAt, label.updatedAt],
  );

  return label;
}

function mapNote(row: NoteRow, checklistItems: ChecklistItem[], labels: Label[]): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    color: row.color,
    isPinned: row.is_pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    trashedAt: row.trashed_at,
    checklistItems,
    labels,
  };
}

function mapChecklistItem(row: ChecklistItemRow): ChecklistItem {
  return {
    id: row.id,
    noteId: row.note_id,
    text: row.text,
    isChecked: row.is_checked === 1,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLabel(row: LabelRow): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseSetting<Key extends keyof AppSettings>(key: Key, value: string): AppSettings[Key] {
  switch (key) {
    case 'gridView':
    case 'biometricLockEnabled':
      return (value === 'true') as AppSettings[Key];
    case 'lockAfterSeconds': {
      const parsed = Number(value);
      return (
        Number.isFinite(parsed) ? parsed : DEFAULT_SETTINGS.lockAfterSeconds
      ) as AppSettings[Key];
    }
  }
}

function serializeSetting(value: AppSettings[keyof AppSettings]) {
  return String(value);
}
