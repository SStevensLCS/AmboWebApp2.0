import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { Application, ApplicationStatus } from '@/hooks/useApplications';

const QUESTION_LABELS = [
  'Why do you want to be a Student Ambassador?',
  'What qualities make a good ambassador?',
  'Describe a time you showed leadership.',
  'How would you promote Linfield to prospective students?',
  'What is your favorite thing about Linfield?',
  'Describe your involvement in campus activities.',
  'How do you handle difficult situations?',
  'What are your goals for the next year?',
  'Is there anything else you would like us to know?',
];

const statusStyles: Record<ApplicationStatus, { bg: string; text: string }> = {
  submitted: { bg: '#eff6ff', text: '#3b82f6' },
  approved: { bg: '#ecfdf5', text: '#10b981' },
  rejected: { bg: '#fef2f2', text: '#ef4444' },
  draft: { bg: '#f5f5f5', text: '#6b7280' },
};

export default function ApplicationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setApplication(data as Application);
      }
      setLoading(false);
    };
    if (id) fetchApplication();
  }, [id]);

  const handleStatusUpdate = async (status: ApplicationStatus) => {
    if (!application) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', application.id);
      if (error) throw error;
      setApplication({ ...application, status });
      Alert.alert('Success', `Application ${status}`);
    } catch {
      Alert.alert('Error', 'Failed to update application status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <Text>Application not found</Text>
      </View>
    );
  }

  const colors = statusStyles[application.status] || statusStyles.draft;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.date}>
          Applied {new Date(application.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Personal Info */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Personal Information</Text>
      <Card style={styles.card}>
        <Card.Content style={styles.infoContent}>
          <InfoRow icon="account" label="Name" value={`${application.first_name} ${application.last_name}`} />
          <Divider />
          <InfoRow icon="email-outline" label="Email" value={application.email} />
          <Divider />
          <InfoRow icon="phone-outline" label="Phone" value={application.phone_number} />
        </Card.Content>
      </Card>

      {/* Academic Info */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Academic Information</Text>
      <Card style={styles.card}>
        <Card.Content style={styles.infoContent}>
          <InfoRow icon="school-outline" label="Current Grade" value={application.grade_current || 'N/A'} />
          <Divider />
          <InfoRow icon="school" label="Entry Grade" value={application.grade_entry || 'N/A'} />
          <Divider />
          <InfoRow icon="chart-line" label="GPA" value={application.gpa || 'N/A'} />
          {application.transcript_url && (
            <>
              <Divider />
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="file-document" size={20} color="#6b7280" />
                <View style={{ flex: 1 }}>
                  <Text variant="labelSmall" style={styles.infoLabel}>Transcript</Text>
                  <Button
                    mode="text"
                    compact
                    onPress={() => Linking.openURL(application.transcript_url!)}
                    style={styles.linkButton}
                  >
                    View Transcript
                  </Button>
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* References */}
      {(application.referrer_1_name || application.referrer_2_name) && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>References</Text>
          <Card style={styles.card}>
            <Card.Content style={styles.infoContent}>
              {application.referrer_1_name && (
                <>
                  <InfoRow icon="account-outline" label="Reference 1" value={`${application.referrer_1_name} (${application.referrer_1_email || 'No email'})`} />
                </>
              )}
              {application.referrer_1_name && application.referrer_2_name && <Divider />}
              {application.referrer_2_name && (
                <InfoRow icon="account-outline" label="Reference 2" value={`${application.referrer_2_name} (${application.referrer_2_email || 'No email'})`} />
              )}
            </Card.Content>
          </Card>
        </>
      )}

      {/* Questionnaire */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Questionnaire</Text>
      {QUESTION_LABELS.map((label, index) => {
        const key = `question_${index + 1}` as keyof Application;
        const answer = application[key] as string | undefined;
        if (!answer) return null;
        return (
          <Card key={index} style={styles.questionCard}>
            <Card.Content>
              <Text variant="labelMedium" style={styles.questionLabel}>{label}</Text>
              <Text variant="bodyMedium" style={styles.answer}>{answer}</Text>
            </Card.Content>
          </Card>
        );
      })}

      {/* Action Buttons */}
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>Actions</Text>
      <View style={styles.actionsRow}>
        <Button
          mode="contained"
          buttonColor="#10b981"
          onPress={() => handleStatusUpdate('approved')}
          loading={updating}
          disabled={updating || application.status === 'approved'}
          style={styles.actionButton}
        >
          Approve
        </Button>
        <Button
          mode="contained"
          buttonColor="#ef4444"
          onPress={() => handleStatusUpdate('rejected')}
          loading={updating}
          disabled={updating || application.status === 'rejected'}
          style={styles.actionButton}
        >
          Reject
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleStatusUpdate('draft')}
          loading={updating}
          disabled={updating || application.status === 'draft'}
          style={styles.actionButton}
        >
          Mark as Draft
        </Button>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#6b7280" />
      <View style={{ flex: 1 }}>
        <Text variant="labelSmall" style={styles.infoLabel}>{label}</Text>
        <Text variant="bodyMedium">{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },
  date: { color: '#9ca3af' },
  sectionTitle: { fontWeight: '600', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', marginBottom: 8 },
  infoContent: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  infoLabel: { color: '#9ca3af', marginBottom: 2 },
  linkButton: { alignSelf: 'flex-start', marginTop: -4, marginLeft: -8 },
  questionCard: { backgroundColor: '#fff', marginBottom: 8 },
  questionLabel: { color: '#6b7280', marginBottom: 6 },
  answer: { lineHeight: 20 },
  divider: { marginVertical: 16 },
  actionsRow: { gap: 10 },
  actionButton: { borderRadius: 8 },
});
