import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen
        name="apply"
        options={{
          headerShown: true,
          title: 'Apply',
          headerBackTitle: 'Login',
        }}
      />
    </Stack>
  );
}
