import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { LoadingScreen, Screen } from '@/components/Screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppLockProvider, useAppLock } from '@/providers/AppLockProvider';
import { NotesProvider, useNotes } from '@/providers/NotesProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NotesProvider>
        <AppLockProvider>
          <RootContent />
        </AppLockProvider>
      </NotesProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function RootContent() {
  const { isReady, error } = useNotes();
  const { isLocked } = useAppLock();

  useEffect(() => {
    if (isReady || error) {
      void SplashScreen.hideAsync();
    }
  }, [error, isReady]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (isLocked) {
    return <LockedScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="editor" />
      <Stack.Screen name="search" />
      <Stack.Screen name="archive" />
      <Stack.Screen name="trash" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

function LockedScreen() {
  const theme = useTheme();
  const { unlock } = useAppLock();

  return (
    <Screen centered>
      <View style={styles.lockPanel}>
        <Text style={[styles.lockTitle, { color: theme.text }]}>Simple Notes is locked</Text>
        <Pressable
          accessibilityRole="button"
          onPress={unlock}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: theme.primaryText }]}>Unlock</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ErrorScreen({ message }: { message: string }) {
  const theme = useTheme();

  return (
    <Screen centered>
      <View style={styles.lockPanel}>
        <Text style={[styles.lockTitle, { color: theme.text }]}>Local database unavailable</Text>
        <Text style={[styles.errorText, { color: theme.textMuted }]}>{message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lockPanel: {
    width: '100%',
    gap: Spacing.four,
    alignItems: 'center',
    padding: Spacing.six,
  },
  lockTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    minWidth: 160,
    height: 48,
    paddingHorizontal: Spacing.six,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
