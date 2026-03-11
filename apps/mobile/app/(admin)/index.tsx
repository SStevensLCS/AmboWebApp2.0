import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';
import { DashboardSkeleton } from '@/components/SkeletonLoader';

interface RecentSubmission {
  id: string;
  service_type: string;
  service_date: string;
  status: string;
  users: { first_name: string; last_name: string } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [upcomingEventCount, setUpcomingEventCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const [submissionsRes, usersRes, applicationsRes, eventsRes, recentRes] = await Promise.all([
      supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_time', new Date().toISOString()),
      supabase.from('submissions').select('id, service_type, service_date, status, users(first_name, last_name)').order('created_at', { ascending: false }).limit(5),
    ]);
    setPendingCount(submissionsRes.count || 0);
    setUserCount(usersRes.count || 0);
    setApplicationCount(applicationsRes.count || 0);
    setUpcomingEventCount(eventsRes.count || 0);
    setRecentSubmissions((recentRes.data as RecentSubmission[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && recentSubmissions.length === 0) return <DashboardSkeleton />;

  const statusColor: Record<string, string> = {
    Pending: '#f59e0b',
    Approved: '#10b981',
    Denied: '#ef4444',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
    >
      <Text variant="headlineSmall" style={styles.heading}>Dashboard</Text>
      <Text variant="bodyMedium" style={styles.subheading}>
        Overview of ambassador program activity.
      </Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, pendingCount > 0 && styles.pendingCard]} onPress={() => router.push('/(admin)/submissions')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="file-clock-outline" size={22} color={pendingCount > 0 ? '#f59e0b' : '#9ca3af'} />
            <Text variant="headlineMedium" style={styles.statValue}>{pendingCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Pending Reviews</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard} onPress={() => router.push('/(admin)/users')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#111827" />
            <Text variant="headlineMedium" style={styles.statValue}>{userCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Users</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, applicationCount > 0 && styles.applicationCard]} onPress={() => router.push('/(admin)/applications')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={applicationCount > 0 ? '#3b82f6' : '#9ca3af'} />
            <Text variant="headlineMedium" style={styles.statValue}>{applicationCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Applications</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard} onPress={() => router.push('/(admin)/events')}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color="#111827" />
            <Text variant="headlineMedium" style={styles.statValue}>{upcomingEventCount}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Upcoming Events</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Access */}
      <Text variant="titleSmall" style={styles.sectionLabel}>QUICK ACCESS</Text>
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
          {pendingCount > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{pendingCount}</Text>
            </View>
          )}
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
          {applicationCount > 0 && (
            <View style={[styles.navBadge, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.navBadgeText, { color: '#3b82f6' }]}>{applicationCount}</Text>
            </View>
          )}
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

      {/* Recent Activity */}
      {recentSubmissions.length > 0 && (
        <>
          <Text variant="titleSmall" style={styles.sectionLabel}>RECENT SUBMISSIONS</Text>
          {recentSubmissions.map((sub) => (
            <Card
              key={sub.id}
              style={styles.activityCard}
              onPress={() => router.push({ pathname: '/(admin)/submissions/[id]', params: { id: sub.id } })}
            >
              <Card.Content style={styles.activityContent}>
                <View style={[styles.activityDot, { backgroundColor: statusColor[sub.status] || '#9ca3af' }]} />
                <View style={styles.activityInfo}>
                  <Text variant="bodyMedium" style={styles.activityTitle}>
                    {sub.users ? `${sub.users.first_name} ${sub.users.last_name}` : 'Unknown'}
                  </Text>
                  <Text variant="bodySmall" style={styles.activitySubtitle}>
                    {sub.service_type} · {sub.service_date}
                  </Text>
                </View>
                <Text variant="labelSmall" style={[styles.activityStatus, { color: statusColor[sub.status] || '#9ca3af' }]}>
                  {sub.status}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontWeight: '700' },
  subheading: { color: '#6b7280', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#fff' },
  pendingCard: { backgroundColor: '#fffbeb' },
  applicationCard: { backgroundColor: '#eff6ff' },
  statContent: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  statValue: { fontWeight: '700' },
  statLabel: { color: '#6b7280', textAlign: 'center' },
  sectionLabel: {
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  navCard: { marginBottom: 10, backgroundColor: '#fff' },
  navContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  navIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontWeight: '600' },
  navSubtitle: { color: '#6b7280' },
  navBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  navBadgeText: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },
  activityCard: { marginBottom: 6, backgroundColor: '#fff' },
  activityContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityInfo: { flex: 1 },
  activityTitle: { fontWeight: '500' },
  activitySubtitle: { color: '#9ca3af' },
  activityStatus: { fontWeight: '600', fontSize: 11 },
});
