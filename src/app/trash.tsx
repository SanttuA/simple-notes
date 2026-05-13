import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { NoteCard } from '@/components/NoteCard';
import { Screen } from '@/components/Screen';
import { Spacing } from '@/constants/theme';
import { filterNotes } from '@/domain/noteFilters';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/providers/NotesProvider';

export default function TrashScreen() {
  const theme = useTheme();
  const { notes, restoreNote, deleteNotePermanently } = useNotes();
  const trashedNotes = useMemo(() => filterNotes(notes, { status: 'trashed' }), [notes]);

  const askDeleteForever = (id: string) => {
    Alert.alert('Delete forever?', 'This permanently removes the trashed note from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNotePermanently(id),
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="arrow-back" label="Back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: theme.text }]}>Trash</Text>
      </View>
      <FlatList
        data={trashedNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          trashedNotes.length === 0 && styles.emptyListContent,
        ]}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <NoteCard
              note={item}
              mode="trashed"
              onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
              onRestore={() => restoreNote(item.id)}
              onDelete={() => askDeleteForever(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trash-outline"
            title="Trash is empty"
            body="Deleted notes appear here first."
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
