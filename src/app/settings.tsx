import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppLock } from '@/providers/AppLockProvider';
import { useNotes } from '@/providers/NotesProvider';

const timeoutOptions = [15, 30, 60, 300];

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, setSetting } = useNotes();
  const { enableBiometricLock, disableBiometricLock } = useAppLock();

  const toggleBiometricLock = async (enabled: boolean) => {
    if (!enabled) {
      await disableBiometricLock();
      return;
    }

    const availability = await enableBiometricLock();
    if (!availability.available) {
      Alert.alert(
        'Biometric lock unavailable',
        availability.reason ?? 'Authentication was not completed.',
      );
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="arrow-back" label="Back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <SettingRow
          title="Grid layout"
          value={
            <Switch
              value={settings.gridView}
              onValueChange={(value) => setSetting('gridView', value)}
              trackColor={{ true: theme.primarySoft, false: theme.border }}
              thumbColor={settings.gridView ? theme.primary : theme.textMuted}
            />
          }
        />
        <SettingRow
          title="Biometric app lock"
          value={
            <Switch
              value={settings.biometricLockEnabled}
              onValueChange={toggleBiometricLock}
              trackColor={{ true: theme.primarySoft, false: theme.border }}
              thumbColor={settings.biometricLockEnabled ? theme.primary : theme.textMuted}
            />
          }
        />

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>Lock timeout</Text>
          <View style={styles.timeoutOptions}>
            {timeoutOptions.map((seconds) => {
              const selected = settings.lockAfterSeconds === seconds;
              return (
                <Pressable
                  key={seconds}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSetting('lockAfterSeconds', seconds)}
                  style={({ pressed }) => [
                    styles.timeoutButton,
                    {
                      backgroundColor: selected ? theme.primary : theme.input,
                      borderColor: selected ? theme.primary : theme.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeoutText,
                      { color: selected ? theme.primaryText : theme.text },
                    ]}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Telemetry</Text>
            <Text style={[styles.rowValue, { color: theme.textMuted }]}>None</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Sync</Text>
            <Text style={[styles.rowValue, { color: theme.textMuted }]}>Off</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function SettingRow({ title, value }: { title: string; value: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.metaRow}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        {value}
      </View>
    </View>
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
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  metaRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeoutOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  timeoutButton: {
    height: 40,
    minWidth: 64,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  timeoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
