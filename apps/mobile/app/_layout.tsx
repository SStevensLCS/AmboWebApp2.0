import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { theme } from '@/lib/theme';

function RootNavigator() {
  const { session, userRole, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inStudentGroup = segments[0] === '(student)';

    if (!session) {
      // Not signed in — redirect to login if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      // Admin signed in — redirect to admin if not already there
      if (!inAdminGroup) {
        router.replace('/(admin)');
      }
    } else {
      // Student signed in — redirect to student if not already there
      if (!inStudentGroup) {
        router.replace('/(student)');
      }
    }
  }, [session, userRole, isLoading]);

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
