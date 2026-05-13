import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { FilterChip } from '@/components/FilterChip';
import { IconButton } from '@/components/IconButton';
import { NoteCard } from '@/components/NoteCard';
import { Screen } from '@/components/Screen';
import { Radius, Spacing } from '@/constants/theme';
import { filterNotes } from '@/domain/noteFilters';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/providers/NotesProvider';

export default function HomeScreen() {
  const theme = useTheme();
  const { notes, labels, settings, togglePinned, archiveNote, trashNote } = useNotes();
  const [labelId, setLabelId] = useState<string | undefined>();
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const visibleNotes = useMemo(
    () => filterNotes(notes, { status: 'active', labelId, pinnedOnly }),
    [labelId, notes, pinnedOnly],
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Local notebook</Text>
          <Text style={[styles.title, { color: theme.text }]}>Simple Notes</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton name="search" label="Search notes" onPress={() => router.push('/search')} />
          <IconButton
            name="archive-outline"
            label="Archive"
            onPress={() => router.push('/archive')}
          />
          <IconButton
            name="settings-outline"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      <View style={styles.chipArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label="All"
            selected={!labelId && !pinnedOnly}
            onPress={() => {
              setLabelId(undefined);
              setPinnedOnly(false);
            }}
          />
          <FilterChip
            label="Pinned"
            selected={pinnedOnly}
            onPress={() => {
              setPinnedOnly((current) => !current);
              setLabelId(undefined);
            }}
          />
          {labels.map((label) => (
            <FilterChip
              key={label.id}
              label={label.name}
              selected={label.id === labelId}
              onPress={() => {
                setLabelId((current) => (current === label.id ? undefined : label.id));
                setPinnedOnly(false);
              }}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={settings.gridView ? 'grid' : 'list'}
        data={visibleNotes}
        numColumns={settings.gridView ? 2 : 1}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          visibleNotes.length === 0 && styles.emptyListContent,
        ]}
        columnWrapperStyle={settings.gridView ? styles.gridRow : undefined}
        renderItem={({ item }) => (
          <View style={settings.gridView ? styles.gridItem : styles.listItem}>
            <NoteCard
              note={item}
              compact={settings.gridView}
              onPress={() => router.push({ pathname: '/editor', params: { id: item.id } })}
              onPin={() => togglePinned(item.id)}
              onArchive={() => archiveNote(item.id)}
              onTrash={() => trashNote(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No notes here"
            body="Create a note or clear the current filter."
          />
        }
      />

      <IconButton
        name="trash-outline"
        label="Trash"
        onPress={() => router.push('/trash')}
        backgroundColor={theme.surface}
        style={styles.trashButton}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create note"
        onPress={() => router.push('/editor')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.78 : 1 },
        ]}
      >
        <Ionicons name="add" size={30} color={theme.primaryText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chipArea: {
    minHeight: 50,
  },
  chips: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 112,
    gap: Spacing.three,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  gridRow: {
    gap: Spacing.three,
  },
  gridItem: {
    flex: 1,
    marginBottom: Spacing.three,
  },
  listItem: {
    marginBottom: Spacing.three,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  trashButton: {
    position: 'absolute',
    left: Spacing.four,
    bottom: Spacing.five,
  },
});
