import React, { useMemo, useState } from 'react';
import { SectionList, View, StyleSheet, RefreshControl, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Card, Text, FAB, Portal, Modal, TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
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

function formatDateTimeForInput(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminEvents() {
  const { events, loading, refetch } = useEvents();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create event form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [uniform, setUniform] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setUniform('');
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000);
    setStartTime(formatDateTimeForInput(now));
    setEndTime(formatDateTimeForInput(later));
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Start and end times are required.');
      return;
    }

    setCreating(true);
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      uniform: uniform.trim() || null,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      created_by: userId,
    });

    setCreating(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowCreate(false);
      refetch();
    }
  };

  const handleDelete = (eventId: string, eventTitle: string) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${eventTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('events').delete().eq('id', eventId);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            refetch();
          }
        },
      },
    ]);
  };

  if (loading && events.length === 0) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <SectionList
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
            onPress={() => router.push({ pathname: '/(admin)/events/[id]', params: { id: item.id } })}
            onLongPress={() => handleDelete(item.id, item.title)}
          >
            <Card.Content>
              <View style={styles.eventHeader}>
                <Text variant="titleMedium" style={styles.eventTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <IconButton
                  icon="delete-outline"
                  size={16}
                  iconColor="#ef4444"
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id, item.title)}
                />
              </View>
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
          <EmptyState icon="calendar-blank-outline" title="No events yet" subtitle="Tap + to create your first event." />
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={handleOpenCreate} />

      {/* Create Event Modal */}
      <Portal>
        <Modal
          visible={showCreate}
          onDismiss={() => setShowCreate(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text variant="titleLarge" style={styles.modalTitle}>Create Event</Text>

              <TextInput
                mode="outlined"
                label="Title *"
                value={title}
                onChangeText={setTitle}
                dense
                style={styles.modalInput}
              />
              <TextInput
                mode="outlined"
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                dense
                style={styles.modalInput}
              />
              <TextInput
                mode="outlined"
                label="Location"
                value={location}
                onChangeText={setLocation}
                dense
                style={styles.modalInput}
              />
              <TextInput
                mode="outlined"
                label="Uniform"
                value={uniform}
                onChangeText={setUniform}
                dense
                style={styles.modalInput}
              />
              <TextInput
                mode="outlined"
                label="Start (YYYY-MM-DDTHH:MM)"
                value={startTime}
                onChangeText={setStartTime}
                dense
                style={styles.modalInput}
                placeholder="2026-03-15T14:00"
              />
              <TextInput
                mode="outlined"
                label="End (YYYY-MM-DDTHH:MM)"
                value={endTime}
                onChangeText={setEndTime}
                dense
                style={styles.modalInput}
                placeholder="2026-03-15T16:00"
              />

              <View style={styles.modalActions}>
                <Button mode="text" onPress={() => setShowCreate(false)}>Cancel</Button>
                <Button
                  mode="contained"
                  onPress={handleCreate}
                  loading={creating}
                  disabled={!title.trim() || creating}
                >
                  Create
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
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
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventTitle: { fontWeight: '600', marginBottom: 6, flex: 1 },
  deleteButton: { margin: -8 },
  eventMeta: { gap: 4, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#6b7280' },
  eventDescription: { color: '#9ca3af' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontWeight: '700', marginBottom: 16 },
  modalInput: { backgroundColor: '#fff', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
