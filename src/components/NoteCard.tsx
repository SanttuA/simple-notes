import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { NotePalette, Radius, Spacing } from '@/constants/theme';
import { formatShortDate } from '@/domain/format';
import { notePreview } from '@/domain/noteFilters';
import { useTheme } from '@/hooks/use-theme';
import type { Note } from '@/types/notes';

type NoteCardMode = 'active' | 'archived' | 'trashed';

type NoteCardProps = {
  note: Note;
  mode?: NoteCardMode;
  compact?: boolean;
  onPress: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
};

export function NoteCard({
  note,
  mode = 'active',
  compact,
  onPress,
  onPin,
  onArchive,
  onTrash,
  onRestore,
  onDelete,
}: NoteCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const palette = NotePalette[note.color];
  const paperColor = colorScheme === 'dark' ? palette.dark : palette.light;
  const paperText = colorScheme === 'dark' ? theme.text : '#202124';
  const paperMuted = colorScheme === 'dark' ? theme.textMuted : '#3C4043';
  const preview = notePreview(note);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${note.title || 'untitled note'}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        {
          backgroundColor: paperColor,
          borderColor: palette.border,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text numberOfLines={2} style={[styles.title, { color: paperText }]}>
          {note.title || 'Untitled'}
        </Text>
        {note.isPinned && <Ionicons name="pin" size={16} color={theme.primary} />}
      </View>

      {preview.length > 0 ? (
        <View style={styles.preview}>
          {preview.map((line, index) => (
            <Text
              key={`${line}-${index}`}
              numberOfLines={1}
              style={[styles.previewText, { color: paperMuted }]}
            >
              {note.type === 'checklist' ? `□ ${line}` : line}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={[styles.previewText, { color: paperMuted }]}>No additional text</Text>
      )}

      {note.labels.length > 0 && (
        <View style={styles.labels}>
          {note.labels.slice(0, 3).map((label) => (
            <View key={label.id} style={[styles.label, { borderColor: palette.border }]}>
              <Text numberOfLines={1} style={[styles.labelText, { color: paperMuted }]}>
                {label.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.date, { color: theme.textMuted }]}>
          {formatShortDate(note.updatedAt)}
        </Text>
        <View style={styles.actions}>
          {mode === 'active' && (
            <>
              {onPin && (
                <IconButton
                  name={note.isPinned ? 'pin' : 'pin-outline'}
                  label={note.isPinned ? 'Unpin note' : 'Pin note'}
                  onPress={onPin}
                  backgroundColor="transparent"
                  style={styles.smallButton}
                />
              )}
              {onArchive && (
                <IconButton
                  name="archive-outline"
                  label="Archive note"
                  onPress={onArchive}
                  backgroundColor="transparent"
                  style={styles.smallButton}
                />
              )}
              {onTrash && (
                <IconButton
                  name="trash-outline"
                  label="Move note to trash"
                  onPress={onTrash}
                  color={theme.danger}
                  backgroundColor="transparent"
                  style={styles.smallButton}
                />
              )}
            </>
          )}
          {mode !== 'active' && onRestore && (
            <IconButton
              name="return-up-back-outline"
              label="Restore note"
              onPress={onRestore}
              backgroundColor="transparent"
              style={styles.smallButton}
            />
          )}
          {mode === 'trashed' && onDelete && (
            <IconButton
              name="close-circle-outline"
              label="Delete forever"
              onPress={onDelete}
              color={theme.danger}
              backgroundColor="transparent"
              style={styles.smallButton}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 156,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  compact: {
    minHeight: 132,
  },
  titleRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
  preview: {
    gap: Spacing.one,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 19,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  label: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  date: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButton: {
    width: 34,
    height: 34,
    borderWidth: 0,
  },
});
