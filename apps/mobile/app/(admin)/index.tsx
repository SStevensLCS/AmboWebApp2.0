import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [submissionsRes, usersRes] = await Promise.all([
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);
    setPendingCount(submissionsRes.count || 0);
    setUserCount(usersRes.count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
    >
      <Text variant="headlineSmall" style={styles.heading}>Dashboard</Text>
      <Text variant="bodyMedium" style={styles.subheading}>
        Manage submissions and users.
      </Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="file-clock-outline" size={24} color="#f59e0b" />
            <Text variant="headlineMedium" style={styles.statValue}>{pendingCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Pending</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard} onPress={() => router.push('/(admin)/users')}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statHeader}>
              <MaterialCommunityIcons name="account-group-outline" size={24} color="#111827" />
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
            </View>
            <Text variant="headlineMedium" style={styles.statValue}>{userCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Users</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Access */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Quick Access</Text>
      <Card style={styles.navCard} onPress={() => router.push('/(admin)/submissions')}>
        <Card.Content style={styles.navContent}>
          <View style={styles.navLeft}>
            <View style={styles.navIcon}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#111827" />
            </View>
            <View>
              <Text variant="bodyLarge" style={styles.navTitle}>Submissions</Text>
              <Text variant="bodySmall" style={styles.navSubtitle}>Review service hours</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </Card.Content>
      </Card>

      <Card style={styles.navCard} onPress={() => router.push('/(admin)/applications')}>
        <Card.Content style={styles.navContent}>
          <View style={styles.navLeft}>
            <View style={[styles.navIcon, { backgroundColor: '#fefce8' }]}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#ca8a04" />
            </View>
            <View>
              <Text variant="bodyLarge" style={styles.navTitle}>Applications</Text>
              <Text variant="bodySmall" style={styles.navSubtitle}>Review ambassador applications</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </Card.Content>
      </Card>

      <Card style={styles.navCard} onPress={() => router.push('/(admin)/resources')}>
        <Card.Content style={styles.navContent}>
          <View style={styles.navLeft}>
            <View style={[styles.navIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialCommunityIcons name="folder-outline" size={20} color="#16a34a" />
            </View>
            <View>
              <Text variant="bodyLarge" style={styles.navTitle}>Resources</Text>
              <Text variant="bodySmall" style={styles.navSubtitle}>Manage files and documents</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontWeight: '700' },
  subheading: { color: '#6b7280', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#f9fafb' },
  statContent: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  statHeader: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' },
  statValue: { fontWeight: '700' },
  statLabel: { color: '#6b7280' },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  navCard: { marginBottom: 10, backgroundColor: '#fff' },
  navContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  navIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontWeight: '600' },
  navSubtitle: { color: '#6b7280' },
});
