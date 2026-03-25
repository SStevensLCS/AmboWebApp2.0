import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { PushNotificationsProvider } from '@/providers/PushNotificationsProvider';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';
import { useBiometricLock } from '@/hooks/useBiometricLock';
import { validateEnv } from '@/lib/env';
import { useChatReadStore } from '@/stores/chatReadStore';
import { theme } from '@/lib/theme';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
  enableAutoSessionTracking: true,
});

// Run at module load — safe now that validateEnv only warns (never throws)
validateEnv();

// Kick off async hydration of persisted chat read state
useChatReadStore.getState().hydrate();

function RootNavigator() {
  const { session, userRole, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Reset the navigation flag when auth state changes
    hasNavigated.current = false;
  }, [session, userRole]);

  useEffect(() => {
    if (isLoading || hasNavigated.current) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inStudentGroup = segments[0] === '(student)';

    if (!session) {
      if (!inAuthGroup) {
        hasNavigated.current = true;
        router.replace('/(auth)/login');
      }
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      if (!inAdminGroup) {
        hasNavigated.current = true;
        router.replace('/(admin)');
      }
    } else if (userRole === 'basic' || userRole === 'applicant') {
      // Route to welcome screen; if already in auth group on welcome, skip
      const onWelcome = inAuthGroup && segments[1] === 'welcome';
      if (!onWelcome) {
        hasNavigated.current = true;
        router.replace('/(auth)/welcome');
      }
    } else if (userRole === 'student') {
      if (!inStudentGroup) {
        hasNavigated.current = true;
        router.replace('/(student)');
      }
    }
  }, [session, userRole, isLoading, segments]);

  return (
    <>
      <OfflineBanner />
      <Slot />
    </>
  );
}

function BiometricGate({ children }: { children: React.ReactNode }) {
  const { isLocked, unlock } = useBiometricLock();

  if (isLocked) {
    return <BiometricLockScreen onUnlock={unlock} />;
  }

  return <>{children}</>;
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <KeyboardProvider>
          <PaperProvider theme={theme}>
            <NetworkProvider>
              <PushNotificationsProvider>
                <BiometricGate>
                  <RootNavigator />
                </BiometricGate>
              </PushNotificationsProvider>
            </NetworkProvider>
          </PaperProvider>
        </KeyboardProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
