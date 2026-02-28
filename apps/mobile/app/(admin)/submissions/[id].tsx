import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, TextInput, Button, SegmentedButtons, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { Submission, SubmissionStatus } from '@ambo/database';

interface SubmissionDetail extends Submission {
  users?: { first_name: string; last_name: string; email: string };
}

export default function SubmissionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubmissionStatus>('Pending');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('submissions')
        .select('*, users(first_name, last_name, email)')
        .eq('id', id)
        .single();

      if (data) {
        const sub = data as SubmissionDetail;
        setSubmission(sub);
        setStatus(sub.status);
        setFeedback(sub.feedback || '');
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('submissions')
      .update({ status, feedback: feedback.trim() || null })
      .eq('id', id);

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'Submission updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  if (loading || !submission) return <LoadingScreen />;

  const studentName = submission.users
    ? `${submission.users.first_name} ${submission.users.last_name}`
    : 'Unknown';

  return (
    <>
      <Stack.Screen options={{ title: 'Review Submission' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Student Info */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.studentName}>{studentName}</Text>
              {submission.users?.email && (
                <Text variant="bodySmall" style={styles.email}>{submission.users.email}</Text>
              )}
            </Card.Content>
          </Card>

          {/* Submission Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>Date</Text>
              <Text variant="bodyMedium">{submission.service_date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>Type</Text>
              <Text variant="bodyMedium">{submission.service_type}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>Hours</Text>
              <Text variant="bodyMedium">{Number(submission.hours)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text variant="labelSmall" style={styles.detailLabel}>Credits</Text>
              <Text variant="bodyMedium">{Number(submission.credits)}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Status Picker */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Status</Text>
          <SegmentedButtons
            value={status}
            onValueChange={(val) => setStatus(val as SubmissionStatus)}
            buttons={[
              { value: 'Pending', label: 'Pending', icon: 'clock-outline' },
              { value: 'Approved', label: 'Approve', icon: 'check' },
              { value: 'Denied', label: 'Deny', icon: 'close' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Feedback */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Feedback</Text>
          <TextInput
            mode="outlined"
            placeholder="Add feedback for the student..."
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  infoCard: { backgroundColor: '#f9fafb', marginBottom: 16 },
  studentName: { fontWeight: '600' },
  email: { color: '#6b7280', marginTop: 2 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { width: '45%', marginBottom: 8 },
  detailLabel: { color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { marginVertical: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  segmentedButtons: { marginBottom: 20 },
  feedbackInput: { backgroundColor: '#fff', marginBottom: 20, minHeight: 100 },
  saveButton: { borderRadius: 12 },
});
