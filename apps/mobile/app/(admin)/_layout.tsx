import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AdminLayout() {
  const { userRole } = useAuth();

  // Guard: only admins and superadmins can access this group
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="submissions" options={{ title: 'Submissions' }} />
      <Tabs.Screen name="users" options={{ title: 'Users' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
