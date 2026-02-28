import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Button, Chip, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useSubmissions } from '@/hooks/useSubmissions';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import type { SubmissionStatus } from '@ambo/database';

const FILTERS: SubmissionStatus[] = ['Approved', 'Pending', 'Denied'];

export default function StudentDashboard() {
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { submissions, loading, refetch } = useSubmissions(userId);
  const [activeFilters, setActiveFilters] = useState<Set<SubmissionStatus>>(new Set(FILTERS));
  const router = useRouter();

  const stats = useMemo(() => {
    const totalHours = submissions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);
    const totalCredits = submissions.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
    return { totalHours, totalCredits };
  }, [submissions]);

  const filtered = useMemo(
    () => submissions.filter((s) => activeFilters.has(s.status)),
    [submissions, activeFilters]
  );

  const toggleFilter = (status: SubmissionStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  if (loading && submissions.length === 0) return <LoadingScreen />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#3b82f6" />
                <Text variant="headlineMedium" style={styles.statValue}>
                  {stats.totalHours.toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Total Hours</Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <MaterialCommunityIcons name="trophy-outline" size={20} color="#7c3aed" />
                <Text variant="headlineMedium" style={styles.statValue}>
                  {stats.totalCredits.toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Total Credits</Text>
              </Card.Content>
            </Card>
          </View>

          {/* Quick Action */}
          <Button
            mode="contained"
            icon="plus-circle-outline"
            onPress={() => router.push('/(student)/new-submission')}
            style={styles.actionButton}
          >
            Log New Activity
          </Button>

          <Divider style={styles.divider} />

          {/* Filters */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Submissions</Text>
          <View style={styles.filterRow}>
            {FILTERS.map((status) => (
              <Chip
                key={status}
                selected={activeFilters.has(status)}
                onPress={() => toggleFilter(status)}
                style={styles.chip}
                compact
              >
                {status}
              </Chip>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.submissionCard}>
          <Card.Content>
            <View style={styles.submissionHeader}>
              <Text variant="bodyMedium" style={styles.submissionType}>{item.service_type}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.submissionDetails}>
              <Text variant="bodySmall" style={styles.detailText}>
                {item.service_date}
              </Text>
              <Text variant="bodySmall" style={styles.detailText}>
                {Number(item.hours)} hrs
              </Text>
              <Text variant="bodySmall" style={styles.detailText}>
                {Number(item.credits)} credits
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState icon="file-document-outline" title="No submissions yet" subtitle="Tap 'Log New Activity' to submit your first service hours." />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  header: { gap: 16, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#f9fafb' },
  statContent: { alignItems: 'center', gap: 4, paddingVertical: 12 },
  statValue: { fontWeight: '700' },
  statLabel: { color: '#6b7280' },
  actionButton: { borderRadius: 12 },
  divider: { marginVertical: 4 },
  sectionTitle: { fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8 },
  chip: { borderRadius: 16 },
  submissionCard: { marginBottom: 8, backgroundColor: '#fff' },
  submissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  submissionType: { fontWeight: '600', flex: 1, marginRight: 8 },
  submissionDetails: { flexDirection: 'row', gap: 16 },
  detailText: { color: '#6b7280' },
});
