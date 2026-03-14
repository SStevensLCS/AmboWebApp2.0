import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';
import { DashboardSkeleton } from '@/components/SkeletonLoader';

export default function AdminDashboard() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [pendingRes, usersRes, applicationsRes, submissionsRes] = await Promise.all([
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
    ]);
    setPendingCount(pendingRes.count || 0);
    setUserCount(usersRes.count || 0);
    setApplicationCount(applicationsRes.count || 0);
    setSubmissionCount(submissionsRes.count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && submissionCount === 0 && pendingCount === 0) return <DashboardSkeleton />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
    >
      <Text variant="headlineSmall" style={styles.heading}>Dashboard</Text>

      <View style={styles.statsGrid}>
        <Card elevation={0} style={[styles.statCard, pendingCount > 0 && styles.pendingCard]} onPress={() => router.push('/(admin)/submissions')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="file-clock-outline" size={22} color={pendingCount > 0 ? '#f59e0b' : '#9ca3af'} />
            <Text variant="headlineMedium" style={styles.statValue}>{pendingCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Pending Reviews</Text>
          </Card.Content>
        </Card>
        <Card elevation={0} style={styles.statCard} onPress={() => router.push('/(admin)/users')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#111827" />
            <Text variant="headlineMedium" style={styles.statValue}>{userCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Users</Text>
          </Card.Content>
        </Card>
        <Card elevation={0} style={[styles.statCard, applicationCount > 0 && styles.applicationCard]} onPress={() => router.push('/(admin)/applications')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={applicationCount > 0 ? '#3b82f6' : '#9ca3af'} />
            <Text variant="headlineMedium" style={styles.statValue}>{applicationCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Applications</Text>
          </Card.Content>
        </Card>
        <Card elevation={0} style={styles.statCard} onPress={() => router.push('/(admin)/submissions')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color="#111827" />
            <Text variant="headlineMedium" style={styles.statValue}>{submissionCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Submissions</Text>
          </Card.Content>
        </Card>
        <Card elevation={0} style={styles.statCard} onPress={() => router.push('/(admin)/resources')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="folder-outline" size={22} color="#16a34a" />
            <Text variant="headlineMedium" style={styles.statValue}>&mdash;</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Resources</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontWeight: '700', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  pendingCard: { backgroundColor: '#fffbeb' },
  applicationCard: { backgroundColor: '#eff6ff' },
  statContent: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  statValue: { fontWeight: '700' },
  statLabel: { color: '#6b7280', textAlign: 'center' },
});
