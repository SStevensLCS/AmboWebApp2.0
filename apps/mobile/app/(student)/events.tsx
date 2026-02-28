import { View, Text, StyleSheet } from 'react-native';

export default function StudentEvents() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <Text style={styles.subtitle}>Upcoming events will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
});
