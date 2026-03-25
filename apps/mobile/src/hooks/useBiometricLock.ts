import { useEffect, useState, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'ambo_biometric_enabled';

/**
 * Hook for biometric app lock (Face ID / Touch ID / Fingerprint).
 *
 * When enabled, the app will prompt for biometric auth when returning
 * from background (after 60s away).
 */
export function useBiometricLock() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if hardware biometrics are available
  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);

      const stored = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(stored === 'true');
      setLoading(false);
    })();
  }, []);

  // Track when app goes to background and lock after 60s
  useEffect(() => {
    if (Platform.OS === 'web' || !isEnabled) return;

    let backgroundAt: number | null = null;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundAt = Date.now();
      } else if (nextState === 'active' && backgroundAt) {
        const awayMs = Date.now() - backgroundAt;
        backgroundAt = null;
        // Lock if away for more than 60 seconds
        if (awayMs > 60_000) {
          setIsLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [isEnabled]);

  const toggle = useCallback(async () => {
    if (!isAvailable) return;

    if (!isEnabled) {
      // Authenticate before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric lock',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
      }
    } else {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      setIsEnabled(false);
      setIsLocked(false);
    }
  }, [isAvailable, isEnabled]);

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock AmboPortal',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      setIsLocked(false);
    }

    return result.success;
  }, []);

  return {
    isAvailable,
    isEnabled,
    isLocked,
    loading,
    toggle,
    unlock,
  };
}
