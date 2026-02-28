import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Chat' }} />
      <Stack.Screen name="[id]" options={{ title: 'Messages' }} />
      <Stack.Screen name="new" options={{ title: 'New Chat', presentation: 'modal' }} />
    </Stack>
  );
}
