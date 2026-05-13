import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { NotePalette, Radius, Spacing } from '@/constants/theme';
import { labelNames, normalizeLabelNames } from '@/domain/noteFilters';
import { useTheme } from '@/hooks/use-theme';
import { useNotes } from '@/providers/NotesProvider';
import type { ChecklistDraftItem, NoteColor, NoteType } from '@/types/notes';

const noteColors = Object.keys(NotePalette) as NoteColor[];

export default function EditorScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { notes, saveNote, trashNote, archiveNote, restoreNote } = useNotes();
  const existingNote = useMemo(() => notes.find((note) => note.id === id), [id, notes]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NoteType>('text');
  const [color, setColor] = useState<NoteColor>('default');
  const [isPinned, setPinned] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistDraftItem[]>([
    { text: '', isChecked: false },
  ]);
  const [labels, setLabels] = useState('');
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingNote) {
      return;
    }

    setTitle(existingNote.title);
    setBody(existingNote.body);
    setType(existingNote.type);
    setColor(existingNote.color);
    setPinned(existingNote.isPinned);
    setChecklistItems(
      existingNote.checklistItems.length > 0
        ? existingNote.checklistItems.map((item) => ({
            id: item.id,
            text: item.text,
            isChecked: item.isChecked,
          }))
        : [{ text: '', isChecked: false }],
    );
    setLabels(labelNames(existingNote.labels));
  }, [existingNote]);

  const save = async () => {
    setSaving(true);
    try {
      await saveNote({
        id: existingNote?.id,
        title,
        body,
        type,
        color,
        isPinned,
        checklistItems,
        labelNames: normalizeLabelNames(labels),
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const askTrash = () => {
    if (!existingNote) {
      router.back();
      return;
    }

    Alert.alert('Move to trash?', 'The note can be restored from Trash.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Move',
        style: 'destructive',
        onPress: async () => {
          await trashNote(existingNote.id);
          router.back();
        },
      },
    ]);
  };

  const addChecklistItem = () => {
    setChecklistItems((current) => [...current, { text: '', isChecked: false }]);
  };

  const palette = NotePalette[color];
  const paperColor = colorScheme === 'dark' ? palette.dark : palette.light;
  const paperText = colorScheme === 'dark' ? theme.text : '#202124';
  const paperMuted = colorScheme === 'dark' ? theme.textMuted : '#777267';

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="arrow-back" label="Back" onPress={() => router.back()} />
        <View style={styles.headerActions}>
          {existingNote?.archivedAt ? (
            <IconButton
              name="return-up-back-outline"
              label="Restore"
              onPress={() => restoreNote(existingNote.id)}
            />
          ) : (
            existingNote && (
              <IconButton
                name="archive-outline"
                label="Archive"
                onPress={async () => {
                  await archiveNote(existingNote.id);
                  router.back();
                }}
              />
            )
          )}
          <IconButton
            name={isPinned ? 'pin' : 'pin-outline'}
            label={isPinned ? 'Unpin' : 'Pin'}
            onPress={() => setPinned((current) => !current)}
          />
          <IconButton name="trash-outline" label="Trash" onPress={askTrash} color={theme.danger} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save note"
            disabled={isSaving}
            onPress={save}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.primary, opacity: pressed || isSaving ? 0.72 : 1 },
            ]}
          >
            <Text style={[styles.saveText, { color: theme.primaryText }]}>Save</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[styles.editorCard, { backgroundColor: paperColor, borderColor: palette.border }]}
        >
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={paperMuted}
            style={[styles.titleInput, { color: paperText }]}
          />

          <View style={styles.segmented}>
            <ModeButton label="Text" selected={type === 'text'} onPress={() => setType('text')} />
            <ModeButton
              label="Checklist"
              selected={type === 'checklist'}
              onPress={() => setType('checklist')}
            />
          </View>

          {type === 'text' ? (
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Note"
              placeholderTextColor={paperMuted}
              multiline
              textAlignVertical="top"
              style={[styles.bodyInput, { color: paperText }]}
            />
          ) : (
            <View style={styles.checklist}>
              {checklistItems.map((item, index) => (
                <View key={`${item.id ?? 'new'}-${index}`} style={styles.checklistRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.isChecked }}
                    onPress={() =>
                      setChecklistItems((current) =>
                        current.map((candidate, candidateIndex) =>
                          candidateIndex === index
                            ? { ...candidate, isChecked: !candidate.isChecked }
                            : candidate,
                        ),
                      )
                    }
                  >
                    <Ionicons
                      name={item.isChecked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={theme.primary}
                    />
                  </Pressable>
                  <TextInput
                    value={item.text}
                    onChangeText={(text) =>
                      setChecklistItems((current) =>
                        current.map((candidate, candidateIndex) =>
                          candidateIndex === index ? { ...candidate, text } : candidate,
                        ),
                      )
                    }
                    placeholder="List item"
                    placeholderTextColor={paperMuted}
                    style={[
                      styles.checklistInput,
                      { color: paperText },
                      item.isChecked && styles.checkedText,
                    ]}
                  />
                  <IconButton
                    name="close"
                    label="Remove item"
                    onPress={() =>
                      setChecklistItems((current) =>
                        current.length === 1
                          ? [{ text: '', isChecked: false }]
                          : current.filter((_, candidateIndex) => candidateIndex !== index),
                      )
                    }
                    backgroundColor="transparent"
                    style={styles.inlineIcon}
                  />
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={addChecklistItem}
                style={({ pressed }) => [styles.addItem, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.addItemText, { color: theme.primary }]}>Add item</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View
          style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Color</Text>
          <View style={styles.swatches}>
            {noteColors.map((noteColor) => {
              const swatch = NotePalette[noteColor];
              return (
                <Pressable
                  key={noteColor}
                  accessibilityRole="button"
                  accessibilityLabel={`${swatch.label} color`}
                  onPress={() => setColor(noteColor)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: swatch.light,
                      borderColor: color === noteColor ? theme.primary : swatch.border,
                      borderWidth: color === noteColor ? 3 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View
          style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Labels</Text>
          <TextInput
            value={labels}
            onChangeText={setLabels}
            placeholder="Home, Work, Ideas"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="words"
            style={[
              styles.labelInput,
              { backgroundColor: theme.input, color: theme.text, borderColor: theme.border },
            ]}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ModeButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.modeButton, { backgroundColor: selected ? theme.primary : 'transparent' }]}
    >
      <Text style={[styles.modeButtonText, { color: selected ? theme.primaryText : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  saveButton: {
    height: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
    gap: Spacing.four,
  },
  editorCard: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  titleInput: {
    minHeight: 48,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  bodyInput: {
    minHeight: 260,
    fontSize: 17,
    lineHeight: 24,
  },
  segmented: {
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(127,127,127,0.18)',
    flexDirection: 'row',
    padding: Spacing.one,
  },
  modeButton: {
    flex: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  checklist: {
    gap: Spacing.three,
  },
  checklistRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checklistInput: {
    flex: 1,
    fontSize: 17,
    minHeight: 44,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  inlineIcon: {
    width: 36,
    height: 36,
    borderWidth: 0,
  },
  addItem: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
  },
  labelInput: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
