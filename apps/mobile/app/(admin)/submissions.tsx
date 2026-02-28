import { View, Text, StyleSheet } from 'react-native';

export default function AdminSubmissions() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submissions</Text>
      <Text style={styles.subtitle}>Review service hour submissions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
});
