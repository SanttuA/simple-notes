import type { Label, Note, NoteFilter } from '@/types/notes';

export function getNoteStatus(note: Note) {
  if (note.trashedAt !== null) {
    return 'trashed';
  }

  if (note.archivedAt !== null) {
    return 'archived';
  }

  return 'active';
}

export function normalizeLabelNames(input: string[] | string) {
  const raw = Array.isArray(input) ? input : input.split(',');
  const seen = new Set<string>();

  return raw
    .map((label) => label.trim().replace(/\s+/g, ' '))
    .filter((label) => {
      if (label.length === 0) {
        return false;
      }

      const key = label.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function noteMatchesQuery(note: Note, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length === 0) {
    return true;
  }

  const searchable = [
    note.title,
    note.body,
    ...note.checklistItems.map((item) => item.text),
    ...note.labels.map((label) => label.name),
  ]
    .join(' ')
    .toLocaleLowerCase();

  return searchable.includes(needle);
}

export function filterNotes(notes: Note[], filter: NoteFilter) {
  return sortNotes(
    notes.filter((note) => {
      if (filter.status !== 'all' && getNoteStatus(note) !== filter.status) {
        return false;
      }

      if (filter.pinnedOnly && !note.isPinned) {
        return false;
      }

      if (filter.labelId && !note.labels.some((label) => label.id === filter.labelId)) {
        return false;
      }

      if (filter.query && !noteMatchesQuery(note, filter.query)) {
        return false;
      }

      return true;
    }),
  );
}

export function sortNotes(notes: Note[]) {
  return [...notes].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    return right.updatedAt - left.updatedAt;
  });
}

export function notePreview(note: Note) {
  if (note.type === 'checklist') {
    const openItems = note.checklistItems.filter((item) => !item.isChecked);
    return openItems.slice(0, 3).map((item) => item.text);
  }

  return note.body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function labelNames(labels: Label[]) {
  return labels.map((label) => label.name).join(', ');
}
