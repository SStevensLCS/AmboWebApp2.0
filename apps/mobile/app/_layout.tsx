import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { theme } from '@/lib/theme';

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
    } else if (userRole) {
      if (!inStudentGroup) {
        hasNavigated.current = true;
        router.replace('/(student)');
      }
    }
  }, [session, userRole, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}
