export type NoteType = 'text' | 'checklist';
export type NoteStatus = 'active' | 'archived' | 'trashed';

export type NoteColor = 'default' | 'sage' | 'sky' | 'amber' | 'coral' | 'grape' | 'slate';

export type ChecklistItem = {
  id: string;
  noteId: string;
  text: string;
  isChecked: boolean;
  position: number;
  createdAt: number;
  updatedAt: number;
};

export type Label = {
  id: string;
  name: string;
  color: NoteColor;
  createdAt: number;
  updatedAt: number;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  type: NoteType;
  color: NoteColor;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  archivedAt: number | null;
  trashedAt: number | null;
  checklistItems: ChecklistItem[];
  labels: Label[];
};

export type ChecklistDraftItem = {
  id?: string;
  text: string;
  isChecked: boolean;
};

export type NoteDraft = {
  id?: string;
  title: string;
  body: string;
  type: NoteType;
  color: NoteColor;
  isPinned: boolean;
  checklistItems: ChecklistDraftItem[];
  labelNames: string[];
};

export type AppSettings = {
  gridView: boolean;
  biometricLockEnabled: boolean;
  lockAfterSeconds: number;
};

export type NoteFilter = {
  status: NoteStatus | 'all';
  query?: string;
  labelId?: string;
  pinnedOnly?: boolean;
};
