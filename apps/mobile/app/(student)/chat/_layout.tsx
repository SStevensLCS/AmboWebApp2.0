import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Chat' }} />
      <Stack.Screen name="[id]" options={{ title: 'Loading...' }} />
      <Stack.Screen name="new" options={{ title: 'New Chat' }} />
      <Stack.Screen name="edit" options={{ title: 'Chat Settings' }} />
    </Stack>
  );
}
