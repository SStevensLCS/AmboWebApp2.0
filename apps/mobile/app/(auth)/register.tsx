import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Registration coming soon</Text>
      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Back to Login</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  link: { marginTop: 16 },
  linkText: { color: '#3b82f6', fontSize: 16 },
});
