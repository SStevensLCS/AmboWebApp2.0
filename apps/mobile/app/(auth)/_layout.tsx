import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          title: 'Create Account',
          headerBackTitle: 'Login',
        }}
      />
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="apply"
        options={{
          headerShown: true,
          title: 'Apply',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
