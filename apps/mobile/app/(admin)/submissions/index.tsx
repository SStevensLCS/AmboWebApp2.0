import React from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSubmissions } from '@/hooks/useSubmissions';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';

export default function AdminSubmissions() {
  const { submissions, loading, refetch } = useSubmissions();
  const router = useRouter();

  if (loading && submissions.length === 0) return <LoadingScreen />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={submissions}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() => router.push({ pathname: '/(admin)/submissions/[id]', params: { id: item.id } })}
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="bodyMedium" style={styles.studentName}>
                {item.users ? `${item.users.first_name} ${item.users.last_name}` : 'Unknown'}
              </Text>
              <StatusBadge status={item.status} />
            </View>
            <Text variant="bodySmall" style={styles.serviceType}>{item.service_type}</Text>
            <View style={styles.cardDetails}>
              <Text variant="bodySmall" style={styles.detailText}>{item.service_date}</Text>
              <Text variant="bodySmall" style={styles.detailText}>{Number(item.hours)} hrs</Text>
              <Text variant="bodySmall" style={styles.detailText}>{Number(item.credits)} credits</Text>
            </View>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState icon="file-document-outline" title="No submissions" subtitle="Submissions will appear here." />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 8, backgroundColor: '#fff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  studentName: { fontWeight: '600', flex: 1, marginRight: 8 },
  serviceType: { color: '#6b7280', marginBottom: 6 },
  cardDetails: { flexDirection: 'row', gap: 16 },
  detailText: { color: '#9ca3af' },
});
