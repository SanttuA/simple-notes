import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getDatabase } from '@/storage/database';
import { createNoteRepository, type NoteRepository } from '@/storage/noteRepository';
import type { AppSettings, Label, Note, NoteDraft } from '@/types/notes';

type NotesContextValue = {
  isReady: boolean;
  error: string | null;
  notes: Note[];
  labels: Label[];
  settings: AppSettings;
  refresh: () => Promise<void>;
  saveNote: (draft: NoteDraft) => Promise<Note>;
  togglePinned: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  deleteNotePermanently: (id: string) => Promise<boolean>;
  setSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => Promise<void>;
};

const NotesContext = createContext<NotesContextValue | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  gridView: true,
  biometricLockEnabled: false,
  lockAfterSeconds: 30,
};

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [repository, setRepository] = useState<NoteRepository | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getDatabase()
      .then((database) => {
        if (!mounted) {
          return null;
        }

        const nextRepository = createNoteRepository(database);
        setRepository(nextRepository);
        return loadData(nextRepository);
      })
      .then((data) => {
        if (!mounted || !data) {
          return;
        }

        setNotes(data.notes);
        setLabels(data.labels);
        setSettings(data.settings);
        setReady(true);
      })
      .catch((caught: unknown) => {
        if (!mounted) {
          return;
        }

        setError(
          caught instanceof Error ? caught.message : 'The local database could not be opened.',
        );
        setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!repository) {
      return;
    }

    const data = await loadData(repository);
    setNotes(data.notes);
    setLabels(data.labels);
    setSettings(data.settings);
  }, [repository]);

  const runAndRefresh = useCallback(
    async <Result,>(operation: (repo: NoteRepository) => Promise<Result>) => {
      if (!repository) {
        throw new Error('The local database is not ready.');
      }

      const result = await operation(repository);
      const data = await loadData(repository);
      setNotes(data.notes);
      setLabels(data.labels);
      setSettings(data.settings);
      return result;
    },
    [repository],
  );

  const value = useMemo<NotesContextValue>(
    () => ({
      isReady,
      error,
      notes,
      labels,
      settings,
      refresh,
      saveNote: (draft) => runAndRefresh((repo) => repo.saveNote(draft)),
      togglePinned: (id) => runAndRefresh((repo) => repo.togglePinned(id)),
      archiveNote: (id) => runAndRefresh((repo) => repo.archiveNote(id)),
      trashNote: (id) => runAndRefresh((repo) => repo.trashNote(id)),
      restoreNote: (id) => runAndRefresh((repo) => repo.restoreNote(id)),
      deleteNotePermanently: (id) => runAndRefresh((repo) => repo.deleteNotePermanently(id)),
      setSetting: async (key, settingValue) => {
        if (!repository) {
          throw new Error('The local database is not ready.');
        }

        await repository.setSetting(key, settingValue);
        const data = await loadData(repository);
        setSettings(data.settings);
      },
    }),
    [error, isReady, labels, notes, refresh, repository, runAndRefresh, settings],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used inside NotesProvider.');
  }

  return context;
}

async function loadData(repository: NoteRepository) {
  const [notes, labels, settings] = await Promise.all([
    repository.listNotes('all'),
    repository.listLabels(),
    repository.getSettings(),
  ]);

  return { notes, labels, settings };
}
