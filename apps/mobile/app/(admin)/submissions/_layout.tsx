import { Stack } from 'expo-router';

export default function SubmissionsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Submissions' }} />
      <Stack.Screen name="[id]" options={{ title: 'Submission Details' }} />
    </Stack>
  );
}
