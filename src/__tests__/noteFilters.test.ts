import { filterNotes, normalizeLabelNames, noteMatchesQuery } from '@/domain/noteFilters';
import type { Note } from '@/types/notes';

const baseNote: Note = {
  id: 'note_1',
  title: 'Project plan',
  body: 'Draft offline-first notes',
  type: 'text',
  color: 'default',
  isPinned: false,
  createdAt: 1,
  updatedAt: 1,
  archivedAt: null,
  trashedAt: null,
  checklistItems: [],
  labels: [],
};

describe('note filtering', () => {
  it('normalizes label input and removes duplicates case-insensitively', () => {
    expect(normalizeLabelNames(' Work, work, Ideas  ,  ')).toEqual(['Work', 'Ideas']);
  });

  it('matches titles, body, labels, and checklist items', () => {
    const note: Note = {
      ...baseNote,
      labels: [{ id: 'label_1', name: 'Home', color: 'slate', createdAt: 1, updatedAt: 1 }],
      checklistItems: [
        {
          id: 'item_1',
          noteId: 'note_1',
          text: 'Buy coffee',
          isChecked: false,
          position: 0,
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    };

    expect(noteMatchesQuery(note, 'coffee')).toBe(true);
    expect(noteMatchesQuery(note, 'home')).toBe(true);
    expect(noteMatchesQuery(note, 'missing')).toBe(false);
  });

  it('keeps permanent-delete candidates out of active filters', () => {
    const active = { ...baseNote, id: 'active' };
    const trashed = { ...baseNote, id: 'trashed', trashedAt: 10, updatedAt: 20 };
    const archived = { ...baseNote, id: 'archived', archivedAt: 10, updatedAt: 30 };

    expect(
      filterNotes([active, trashed, archived], { status: 'active' }).map((note) => note.id),
    ).toEqual(['active']);
    expect(
      filterNotes([active, trashed, archived], { status: 'trashed' }).map((note) => note.id),
    ).toEqual(['trashed']);
  });

  it('sorts pinned notes before regular notes and then by update time', () => {
    const oldPinned = { ...baseNote, id: 'oldPinned', isPinned: true, updatedAt: 1 };
    const newRegular = { ...baseNote, id: 'newRegular', updatedAt: 100 };
    const newPinned = { ...baseNote, id: 'newPinned', isPinned: true, updatedAt: 200 };

    expect(
      filterNotes([oldPinned, newRegular, newPinned], { status: 'active' }).map((note) => note.id),
    ).toEqual(['newPinned', 'oldPinned', 'newRegular']);
  });
});
