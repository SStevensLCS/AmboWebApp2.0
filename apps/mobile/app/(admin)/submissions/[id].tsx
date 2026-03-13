import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, TextInput, Button, Divider, Avatar, Dialog, Portal } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { Submission, SubmissionStatus } from '@ambo/database';

interface SubmissionDetail extends Submission {
  users?: { first_name: string; last_name: string; email: string; avatar_url?: string };
}

export default function SubmissionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<SubmissionStatus | null>(null);

  useEffect(() => {
    async function fetchSubmission() {
      const { data } = await supabase
        .from('submissions')
        .select('*, users(first_name, last_name, email, avatar_url)')
        .eq('id', id)
        .single();

      if (data) {
        const sub = data as SubmissionDetail;
        setSubmission(sub);
        setFeedback(sub.feedback || '');
      }
      setLoading(false);
    }
    fetchSubmission();
  }, [id]);

  const handleAction = async (newStatus: SubmissionStatus) => {
    if (newStatus === 'Denied' && feedback.trim().length < 10) {
      Alert.alert('Feedback Required', 'Please provide at least 10 characters of feedback when denying a submission.');
      return;
    }
    setConfirmAction(newStatus);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setSaving(true);
    setConfirmAction(null);

    const { error } = await supabase
      .from('submissions')
      .update({ status: confirmAction, feedback: feedback.trim() || null })
      .eq('id', id);

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        confirmAction === 'Approved' ? 'Approved' : 'Denied',
        `Submission has been ${confirmAction.toLowerCase()}.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  };

  if (loading || !submission) return <LoadingScreen />;

  const studentName = submission.users
    ? `${submission.users.first_name} ${submission.users.last_name}`
    : 'Unknown';
  const initials = submission.users
    ? `${submission.users.first_name?.[0] || ''}${submission.users.last_name?.[0] || ''}`
    : '?';
  const isPending = submission.status === 'Pending';
  const serviceDate = new Date(submission.service_date).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Review Submission' }} />
      <Portal>
        <Dialog visible={confirmAction !== null} onDismiss={() => setConfirmAction(null)}>
          <Dialog.Title>
            {confirmAction === 'Approved' ? 'Approve Submission' : 'Deny Submission'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {confirmAction === 'Approved'
                ? `Approve ${studentName}'s ${submission.service_type} submission for ${Number(submission.hours)} hours?`
                : `Deny ${studentName}'s ${submission.service_type} submission?`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              onPress={executeAction}
              textColor={confirmAction === 'Approved' ? '#10b981' : '#ef4444'}
            >
              {confirmAction === 'Approved' ? 'Approve' : 'Deny'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Student Info Card */}
          <Card elevation={0} style={styles.studentCard}>
            <Card.Content style={styles.studentContent}>
              <View style={styles.studentRow}>
                {submission.users?.avatar_url ? (
                  <Avatar.Image size={48} source={{ uri: submission.users.avatar_url }} />
                ) : (
                  <Avatar.Text size={48} label={initials} style={styles.avatarFallback} />
                )}
                <View style={styles.studentInfo}>
                  <Text variant="titleMedium" style={styles.studentName}>{studentName}</Text>
                  {submission.users?.email && (
                    <Text variant="bodySmall" style={styles.email}>{submission.users.email}</Text>
                  )}
                </View>
              </View>
              <StatusBadge status={submission.status} />
            </Card.Content>
          </Card>

          {/* Submission Details */}
          <Text variant="titleSmall" style={styles.sectionLabel}>SUBMISSION DETAILS</Text>
          <Card elevation={0} style={styles.detailsCard}>
            <Card.Content style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconRow}>
                  <MaterialCommunityIcons name="briefcase-outline" size={18} color="#6b7280" />
                  <Text variant="bodySmall" style={styles.detailLabel}>Service Type</Text>
                </View>
                <Text variant="bodyMedium" style={styles.detailValue}>{submission.service_type}</Text>
              </View>
              <Divider style={styles.rowDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconRow}>
                  <MaterialCommunityIcons name="calendar-outline" size={18} color="#6b7280" />
                  <Text variant="bodySmall" style={styles.detailLabel}>Date</Text>
                </View>
                <Text variant="bodyMedium" style={styles.detailValue}>{serviceDate}</Text>
              </View>
              <Divider style={styles.rowDivider} />
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text variant="headlineSmall" style={styles.statNumber}>{Number(submission.hours)}</Text>
                  <Text variant="bodySmall" style={styles.statUnit}>Hours</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text variant="headlineSmall" style={styles.statNumber}>{Number(submission.credits)}</Text>
                  <Text variant="bodySmall" style={styles.statUnit}>Credits</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Feedback Section */}
          <Text variant="titleSmall" style={styles.sectionLabel}>FEEDBACK</Text>
          <TextInput
            mode="outlined"
            placeholder={isPending ? 'Add feedback for the student...' : 'Feedback'}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            style={styles.feedbackInput}
            editable={isPending}
          />
          {isPending && feedback.length > 0 && feedback.length < 10 && (
            <Text variant="bodySmall" style={styles.charCount}>
              {10 - feedback.length} more characters needed for denial
            </Text>
          )}

          {/* Action Buttons */}
          {isPending && (
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="check-circle-outline"
                buttonColor="#10b981"
                textColor="#fff"
                onPress={() => handleAction('Approved')}
                loading={saving}
                disabled={saving}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
              >
                Approve
              </Button>
              <Button
                mode="contained"
                icon="close-circle-outline"
                buttonColor="#ef4444"
                textColor="#fff"
                onPress={() => handleAction('Denied')}
                loading={saving}
                disabled={saving || feedback.trim().length < 10}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
              >
                Deny
              </Button>
            </View>
          )}

          {/* Already reviewed - show update button */}
          {!isPending && (
            <Button
              mode="outlined"
              onPress={async () => {
                setSaving(true);
                const { error } = await supabase
                  .from('submissions')
                  .update({ feedback: feedback.trim() || null })
                  .eq('id', id);
                setSaving(false);
                if (error) {
                  Alert.alert('Error', error.message);
                } else {
                  Alert.alert('Updated', 'Feedback updated.', [
                    { text: 'OK', onPress: () => router.back() },
                  ]);
                }
              }}
              loading={saving}
              disabled={saving || feedback === (submission.feedback || '')}
              style={styles.updateButton}
            >
              Update Feedback
            </Button>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  studentCard: { backgroundColor: '#fff', marginBottom: 20 },
  studentContent: { gap: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarFallback: { backgroundColor: '#e5e7eb' },
  studentInfo: { flex: 1 },
  studentName: { fontWeight: '700' },
  email: { color: '#6b7280', marginTop: 2 },
  sectionLabel: {
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  detailsCard: { backgroundColor: '#fff', marginBottom: 20 },
  detailsContent: { gap: 0 },
  detailRow: {
    paddingVertical: 12,
  },
  detailIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  detailLabel: { color: '#9ca3af' },
  detailValue: { fontWeight: '500', marginLeft: 26 },
  rowDivider: { backgroundColor: '#f3f4f6' },
  statsRow: {
    flexDirection: 'row',
    paddingTop: 12,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statDivider: { width: 1, backgroundColor: '#f3f4f6' },
  statNumber: { fontWeight: '700', color: '#111827' },
  statUnit: { color: '#9ca3af', marginTop: 2 },
  feedbackInput: { backgroundColor: '#fff', marginBottom: 8, minHeight: 100 },
  charCount: { color: '#f59e0b', marginBottom: 12, marginLeft: 4 },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: { borderRadius: 12, marginTop: 16 },
});
