import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { EventDateTimePicker } from '@/components/EventDateTimePicker';

export default function NewEvent() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id || '';

  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uniform, setUniform] = useState('');
  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(later);
  const [allDay, setAllDay] = useState(false);
  const [rsvpOptions, setRsvpOptions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }

    setCreating(true);
    const { data: newEvent, error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim() || null,
      uniform: uniform.trim() || null,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      created_by: userId,
    }).select().single();

    if (error) {
      setCreating(false);
      Alert.alert('Error', error.message);
      return;
    }

    // Insert RSVP options if any
    const validOptions = rsvpOptions.filter(o => o.trim());
    if (validOptions.length > 0 && newEvent) {
      await supabase.from('event_rsvp_options').insert(
        validOptions.map((label, idx) => ({
          event_id: newEvent.id,
          label: label.trim(),
          sort_order: idx,
        }))
      );
    }

    setCreating(false);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Create Event' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            mode="outlined"
            label="Title *"
            value={title}
            onChangeText={setTitle}
            dense
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            dense
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Uniform"
            value={uniform}
            onChangeText={setUniform}
            dense
            style={styles.input}
          />

          <Text variant="labelMedium" style={styles.dateLabel}>Date & Time</Text>
          <EventDateTimePicker
            startDate={startDate}
            endDate={endDate}
            allDay={allDay}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onAllDayChange={setAllDay}
          />

          <Text variant="labelMedium" style={styles.sectionLabel}>RSVP Options (optional)</Text>
          <Text variant="bodySmall" style={styles.rsvpHint}>
            Add custom RSVP options. Leave empty for default Going/Maybe/Can't Go.
          </Text>
          {rsvpOptions.map((opt, idx) => (
            <View key={idx} style={styles.rsvpOptionRow}>
              <TextInput
                mode="outlined"
                value={opt}
                onChangeText={(text) => {
                  const updated = [...rsvpOptions];
                  updated[idx] = text;
                  setRsvpOptions(updated);
                }}
                placeholder={`Option ${idx + 1}`}
                dense
                style={styles.rsvpOptionInput}
              />
              <IconButton
                icon="close"
                size={18}
                onPress={() => setRsvpOptions(rsvpOptions.filter((_, i) => i !== idx))}
              />
            </View>
          ))}
          {rsvpOptions.length < 10 && (
            <Button
              mode="text"
              icon="plus"
              onPress={() => setRsvpOptions([...rsvpOptions, ''])}
              compact
              style={styles.addOptionButton}
            >
              Add RSVP Option
            </Button>
          )}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={() => router.back()} style={styles.actionButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={creating}
              disabled={!title.trim() || creating}
              style={styles.actionButton}
            >
              Create Event
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  input: { backgroundColor: '#fff', marginBottom: 12 },
  dateLabel: { fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 4 },
  sectionLabel: { fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  rsvpHint: { color: '#9ca3af', marginBottom: 8, marginTop: -4 },
  rsvpOptionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rsvpOptionInput: { flex: 1, backgroundColor: '#fff' },
  addOptionButton: { alignSelf: 'flex-start', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flex: 1, borderRadius: 8 },
});
