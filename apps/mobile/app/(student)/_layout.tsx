import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function StudentLayout() {
  const { userRole } = useAuth();

  // Guard: only students can access this group
  if (userRole !== 'student') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
