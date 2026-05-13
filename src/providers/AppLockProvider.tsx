import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { shouldLockOnForeground } from '@/lock/lockPolicy';
import { useNotes } from '@/providers/NotesProvider';

type LockAvailability = {
  available: boolean;
  reason: string | null;
};

type AppLockContextValue = {
  isLocked: boolean;
  unlock: () => Promise<boolean>;
  enableBiometricLock: () => Promise<LockAvailability>;
  disableBiometricLock: () => Promise<void>;
  checkAvailability: () => Promise<LockAvailability>;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { settings, setSetting, isReady } = useNotes();
  const [isLocked, setLocked] = useState(false);
  const [lastBackgroundAt, setLastBackgroundAt] = useState<number | null>(null);

  useEffect(() => {
    if (isReady && settings.biometricLockEnabled) {
      setLocked(true);
    }
  }, [isReady, settings.biometricLockEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setLastBackgroundAt(Date.now());
        return;
      }

      if (
        nextState === 'active' &&
        shouldLockOnForeground(
          settings.biometricLockEnabled,
          lastBackgroundAt,
          settings.lockAfterSeconds,
          Date.now(),
        )
      ) {
        setLocked(true);
      }
    });

    return () => subscription.remove();
  }, [lastBackgroundAt, settings.biometricLockEnabled, settings.lockAfterSeconds]);

  const checkAvailability = useCallback(async (): Promise<LockAvailability> => {
    const [hasHardware, isEnrolled, enrolledLevel] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);

    if (!hasHardware) {
      return { available: false, reason: 'This device does not expose biometric hardware.' };
    }

    if (!isEnrolled) {
      return { available: false, reason: 'No biometric credential is enrolled on this device.' };
    }

    if (enrolledLevel < LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG) {
      return { available: false, reason: 'Strong biometrics are required for app lock.' };
    }

    return { available: true, reason: null };
  }, []);

  const unlock = useCallback(async () => {
    const availability = await checkAvailability();
    if (!availability.available) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Simple Notes',
      cancelLabel: 'Cancel',
      biometricsSecurityLevel: 'strong',
      requireConfirmation: true,
    });

    if (result.success) {
      setLocked(false);
      return true;
    }

    return false;
  }, [checkAvailability]);

  const enableBiometricLock = useCallback(async () => {
    const availability = await checkAvailability();
    if (!availability.available) {
      return availability;
    }

    const unlocked = await unlock();
    if (!unlocked) {
      return { available: false, reason: 'Authentication was not completed.' };
    }

    await setSetting('biometricLockEnabled', true);
    return availability;
  }, [checkAvailability, setSetting, unlock]);

  const disableBiometricLock = useCallback(async () => {
    await setSetting('biometricLockEnabled', false);
    setLocked(false);
  }, [setSetting]);

  const value = useMemo<AppLockContextValue>(
    () => ({
      isLocked,
      unlock,
      enableBiometricLock,
      disableBiometricLock,
      checkAvailability,
    }),
    [checkAvailability, disableBiometricLock, enableBiometricLock, isLocked, unlock],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used inside AppLockProvider.');
  }

  return context;
}
