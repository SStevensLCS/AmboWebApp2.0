import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  IconButton,
  Divider,
  Avatar,
  SegmentedButtons,
} from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useEventDetail } from '@/hooks/useEventDetail';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { EventDetails, RSVPStatus } from '@ambo/database';

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const { comments, rsvps, myRsvp, loading, updateRsvp, postComment } = useEventDetail(id, userId);

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setEvent(data as EventDetails);
      setEventLoading(false);
    }
    fetchEvent();
  }, [id]);

  if (eventLoading || !event) return <LoadingScreen />;

  const start = formatDateTime(event.start_time);
  const end = formatDateTime(event.end_time);

  const goingCount = rsvps.filter((r) => r.status === 'going').length;
  const maybeCount = rsvps.filter((r) => r.status === 'maybe').length;

  const handleRsvp = async (status: string) => {
    await updateRsvp(status as RSVPStatus);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    await postComment(commentText.trim());
    setCommentText('');
    setPosting(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Event Info */}
          <Text variant="headlineSmall" style={styles.title}>{event.title}</Text>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={18} color="#3b82f6" />
            <Text variant="bodyMedium">{start.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#3b82f6" />
            <Text variant="bodyMedium">{start.time} - {end.time}</Text>
          </View>
          {event.location && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color="#3b82f6" />
              <Text variant="bodyMedium">{event.location}</Text>
            </View>
          )}

          {event.uniform && (
            <Card style={styles.uniformCard}>
              <Card.Content style={styles.uniformContent}>
                <MaterialCommunityIcons name="tshirt-crew-outline" size={18} color="#3b82f6" />
                <Text variant="bodyMedium" style={styles.uniformText}>Uniform: {event.uniform}</Text>
              </Card.Content>
            </Card>
          )}

          {event.description && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodyMedium" style={styles.description}>{event.description}</Text>
            </>
          )}

          {/* RSVP */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>RSVP</Text>
          <SegmentedButtons
            value={myRsvp || ''}
            onValueChange={handleRsvp}
            buttons={[
              { value: 'going', label: `Going (${goingCount})`, icon: 'check' },
              { value: 'maybe', label: `Maybe (${maybeCount})`, icon: 'help-circle-outline' },
              { value: 'no', label: "Can't Go", icon: 'close' },
            ]}
            style={styles.rsvpButtons}
          />

          {/* Attendees */}
          {rsvps.filter((r) => r.status === 'going').length > 0 && (
            <View style={styles.attendeesSection}>
              <Text variant="bodySmall" style={styles.attendeesLabel}>Going:</Text>
              <Text variant="bodySmall" style={styles.attendeesText}>
                {rsvps
                  .filter((r) => r.status === 'going')
                  .map((r) => `${r.users.first_name} ${r.users.last_name}`)
                  .join(', ')}
              </Text>
            </View>
          )}

          {/* Comments */}
          <Divider style={styles.divider} />
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Comments ({comments.length})
          </Text>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Avatar.Text
                size={32}
                label={`${comment.users.first_name[0]}${comment.users.last_name[0]}`}
                style={styles.commentAvatar}
              />
              <View style={styles.commentBody}>
                <Text variant="bodySmall" style={styles.commentAuthor}>
                  {comment.users.first_name} {comment.users.last_name}
                </Text>
                <Text variant="bodyMedium">{comment.content}</Text>
                <Text variant="labelSmall" style={styles.commentTime}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}

          {/* Comment Input */}
          <View style={styles.commentInput}>
            <TextInput
              mode="outlined"
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentTextInput}
              dense
            />
            <IconButton
              icon="send"
              mode="contained"
              onPress={handlePostComment}
              disabled={!commentText.trim() || posting}
              loading={posting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontWeight: '700', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  uniformCard: { backgroundColor: '#eff6ff', marginTop: 12 },
  uniformContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uniformText: { color: '#1d4ed8' },
  divider: { marginVertical: 16 },
  description: { color: '#374151', lineHeight: 22 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  rsvpButtons: { marginBottom: 12 },
  attendeesSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  attendeesLabel: { fontWeight: '600', color: '#374151' },
  attendeesText: { color: '#6b7280', flex: 1 },
  comment: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  commentAvatar: { backgroundColor: '#e5e7eb' },
  commentBody: { flex: 1 },
  commentAuthor: { fontWeight: '600', marginBottom: 2 },
  commentTime: { color: '#9ca3af', marginTop: 4 },
  commentInput: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  commentTextInput: { flex: 1, backgroundColor: '#fff' },
});
