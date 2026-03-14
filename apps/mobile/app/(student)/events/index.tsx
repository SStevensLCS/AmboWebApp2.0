import React, { useMemo, useState } from 'react';
import { SectionList, View, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEvents } from '@/hooks/useEvents';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

type EventFilter = 'upcoming' | 'all' | 'past';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function StudentEvents() {
  const { events, loading, error, refetch } = useEvents();
  const router = useRouter();
  const [filter, setFilter] = useState<EventFilter>('upcoming');

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      if (filter === 'upcoming') return new Date(e.end_time) >= now;
      if (filter === 'past') return new Date(e.end_time) < now;
      return true;
    });
  }, [events, filter]);

  const sections = useMemo(() => {
    const grouped: Record<string, typeof filteredEvents> = {};
    for (const event of filteredEvents) {
      const dateKey = new Date(event.start_time).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    }
    const sorted = Object.entries(grouped).sort(([a], [b]) => {
      if (filter === 'past') return b.localeCompare(a);
      return a.localeCompare(b);
    });
    return sorted.map(([date, data]) => ({
      title: formatDate(date + 'T12:00:00'),
      data,
    }));
  }, [filteredEvents, filter]);

  if (loading && events.length === 0) return <LoadingScreen />;
  if (error && events.length === 0) return <ErrorState message={error} onRetry={refetch} />;

  const emptyMessages: Record<EventFilter, string> = {
    upcoming: 'No upcoming events scheduled.',
    past: 'No past events.',
    all: 'Events will appear here when they\'re scheduled.',
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.filterRow}>
        {(['upcoming', 'all', 'past'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            showSelectedOverlay
            style={styles.filterChip}
            compact
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </View>
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
          <Pressable
            onPress={() => router.push({ pathname: '/(student)/events/[id]', params: { id: item.id } })}
          >
            <Card elevation={0} style={styles.eventCard}>
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
                </View>
                {item.description && (
                  <Text variant="bodySmall" style={styles.eventDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </Card.Content>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState icon="calendar-blank-outline" title="No events" subtitle={emptyMessages[filter]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  filterChip: {},
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    fontWeight: '600',
    color: '#374151',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  eventCard: { marginBottom: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  eventTitle: { fontWeight: '600', marginBottom: 6 },
  eventMeta: { gap: 4, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6b7280' },
  eventDescription: { color: '#9ca3af' },
});
