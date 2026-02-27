import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

export default function StudentProfile() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  button: {
    backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
