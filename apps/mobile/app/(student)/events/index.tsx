import React, { useMemo } from 'react';
import { SectionList, View, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEvents } from '@/hooks/useEvents';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function StudentEvents() {
  const { events, loading, refetch } = useEvents();
  const router = useRouter();

  const sections = useMemo(() => {
    const grouped: Record<string, typeof events> = {};
    for (const event of events) {
      const dateKey = new Date(event.start_time).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        title: formatDate(date + 'T12:00:00'),
        data,
      }));
  }, [events]);

  if (loading && events.length === 0) return <LoadingScreen />;

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      renderSectionHeader={({ section }) => (
        <Text variant="titleSmall" style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <Card
          style={styles.eventCard}
          onPress={() => router.push({ pathname: '/(student)/events/[id]', params: { id: item.id } })}
        >
          <Card.Content>
            <Text variant="titleMedium" style={styles.eventTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
                <Text variant="bodySmall" style={styles.metaText}>
                  {formatTime(item.start_time)} - {formatTime(item.end_time)}
                </Text>
              </View>
              {item.location && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6b7280" />
                  <Text variant="bodySmall" style={styles.metaText}>{item.location}</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text variant="bodySmall" style={styles.eventDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyState icon="calendar-blank-outline" title="No events yet" subtitle="Events will appear here when they're scheduled." />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    fontWeight: '600',
    color: '#374151',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  eventCard: { marginBottom: 10, backgroundColor: '#fff' },
  eventTitle: { fontWeight: '600', marginBottom: 6 },
  eventMeta: { gap: 4, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6b7280' },
  eventDescription: { color: '#9ca3af' },
});
