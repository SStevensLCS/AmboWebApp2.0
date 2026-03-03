import { Stack } from 'expo-router';

export default function ApplicationsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Applications' }} />
      <Stack.Screen name="[id]" options={{ title: 'Application Detail' }} />
    </Stack>
  );
}
