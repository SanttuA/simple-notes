import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { NoteCard } from '@/components/NoteCard';
import { Screen } from '@/components/Screen';
import { Spacing } from '@/constants/theme';
import { filterNotes } from '@/domain/noteFilters';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/providers/NotesProvider';

export default function ArchiveScreen() {
  const theme = useTheme();
  const { notes, restoreNote, trashNote } = useNotes();
  const archivedNotes = useMemo(() => filterNotes(notes, { status: 'archived' }), [notes]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="arrow-back" label="Back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: theme.text }]}>Archive</Text>
      </View>
      <FlatList
        data={archivedNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          archivedNotes.length === 0 && styles.emptyListContent,
        ]}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <NoteCard
              note={item}
              mode="archived"
              onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
              onRestore={() => restoreNote(item.id)}
              onTrash={() => trashNote(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="archive-outline"
            title="Archive is empty"
            body="Archived notes stay local and can be restored later."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.eight,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listItem: {
    marginBottom: Spacing.three,
  },
});
