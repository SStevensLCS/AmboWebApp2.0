import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { CheddarRain } from '@/components/CheddarRain';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cheddarActive, setCheddarActive] = useState(false);

  useEffect(() => {
    // Log Supabase config on mount to aid debugging
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (__DEV__) {
      console.log('[Login] Supabase URL configured:', url ? url.substring(0, 30) + '...' : 'MISSING');
      console.log('[Login] Supabase anon key configured:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'yes' : 'MISSING');
    }
  }, []);

  async function handleLogin() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Login Error', 'Please enter both email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Login Error', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    if (__DEV__) console.log('[Login] Attempting sign-in for:', trimmedEmail);
    try {
      await signIn(trimmedEmail, password);
      if (__DEV__) console.log('[Login] signIn resolved successfully');
    } catch (error: any) {
      if (__DEV__) console.error('[Login] signIn error:', error.message);
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <CheddarRain isActive={cheddarActive} onComplete={() => setCheddarActive(false)} />

        <Text style={styles.title}>AmboPortal</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cheddarButton}
          onPress={() => setCheddarActive(true)}
          disabled={cheddarActive}
        >
          <Text style={styles.cheddarText}>Feeling Cheddar? 🧀</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14,
    fontSize: 16, marginBottom: 12, backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#111827', borderRadius: 8, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cheddarButton: {
    alignItems: 'center',
    marginTop: 24,
    padding: 8,
  },
  cheddarText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
