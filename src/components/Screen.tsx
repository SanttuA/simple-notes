import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: React.ReactNode;
  padded?: boolean;
  centered?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, padded = true, centered, style }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.content,
          padded && styles.padded,
          centered && styles.centered,
          { backgroundColor: theme.background },
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

export function LoadingScreen() {
  const theme = useTheme();

  return (
    <Screen centered>
      <ActivityIndicator color={theme.primary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: Spacing.four,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
