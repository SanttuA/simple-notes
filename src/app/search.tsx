import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { NoteCard } from '@/components/NoteCard';
import { Screen } from '@/components/Screen';
import { Radius, Spacing } from '@/constants/theme';
import { filterNotes } from '@/domain/noteFilters';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/providers/NotesProvider';

export default function SearchScreen() {
  const theme = useTheme();
  const { notes } = useNotes();
  const [query, setQuery] = useState('');
  const results = useMemo(() => filterNotes(notes, { status: 'active', query }), [notes, query]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="arrow-back" label="Back" onPress={() => router.back()} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search notes"
          placeholderTextColor={theme.textMuted}
          autoFocus
          style={[
            styles.searchInput,
            { backgroundColor: theme.input, borderColor: theme.border, color: theme.text },
          ]}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          results.length === 0 && styles.emptyListContent,
        ]}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <NoteCard
              note={item}
              onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No matches"
            body="Try a title, label, or checklist item."
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
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    height: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    fontSize: 16,
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
