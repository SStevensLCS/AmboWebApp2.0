import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (userRole === 'admin' || userRole === 'superadmin') {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(student)" />;
}
