import { createNoteRepository } from '@/storage/noteRepository';

describe('note repository destructive guards', () => {
  it('permanently deletes only notes already in trash', async () => {
    const runAsync = jest.fn().mockResolvedValue({ changes: 0, lastInsertRowId: 0 });
    const repository = createNoteRepository({ runAsync } as never);

    await repository.deleteNotePermanently('note_1');

    expect(runAsync).toHaveBeenCalledWith(
      'DELETE FROM notes WHERE id = ? AND trashed_at IS NOT NULL',
      'note_1',
    );
  });
});
