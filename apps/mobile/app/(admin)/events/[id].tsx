import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput as RNTextInput,
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
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function AdminEventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const router = useRouter();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const commentInputRef = useRef<RNTextInput>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const insets = useSafeAreaInsets();
  const { comments, rsvps, myRsvp, loading, updateRsvp, postComment } = useEventDetail(id, userId);

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (data) {
        const e = data as EventDetails;
        setEvent(e);
        setEditTitle(e.title);
        setEditDescription(e.description || '');
        setEditLocation(e.location || '');
      }
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
    commentInputRef.current?.focus();
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('events')
      .update({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        location: editLocation.trim() || null,
      })
      .eq('id', id);

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEvent({ ...event, title: editTitle.trim(), description: editDescription.trim() || null, location: editLocation.trim() || null });
      setEditing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('events').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            router.back();
          }
        },
      },
    ]);
  };

  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 44 : 0;

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Admin Actions */}
          <View style={styles.adminActions}>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => setEditing(!editing)}
              compact
            >
              {editing ? 'Cancel Edit' : 'Edit'}
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              textColor="#ef4444"
              onPress={handleDelete}
              compact
            >
              Delete
            </Button>
          </View>

          {/* Event Info or Edit Form */}
          {editing ? (
            <View style={styles.editSection}>
              <TextInput
                mode="outlined"
                label="Title"
                value={editTitle}
                onChangeText={setEditTitle}
                dense
                style={styles.editInput}
              />
              <TextInput
                mode="outlined"
                label="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
                dense
                style={styles.editInput}
              />
              <TextInput
                mode="outlined"
                label="Location"
                value={editLocation}
                onChangeText={setEditLocation}
                dense
                style={styles.editInput}
              />
              <Button
                mode="contained"
                onPress={handleSaveEdit}
                loading={saving}
                disabled={!editTitle.trim() || saving}
                style={styles.saveButton}
              >
                Save Changes
              </Button>
            </View>
          ) : (
            <>
              <Text variant="headlineSmall" style={styles.title}>{event.title}</Text>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar" size={18} color="#111827" />
                <Text variant="bodyMedium">{start.date}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#111827" />
                <Text variant="bodyMedium">{start.time} - {end.time}</Text>
              </View>
              {event.location && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color="#111827" />
                  <Text variant="bodyMedium">{event.location}</Text>
                </View>
              )}

              {event.uniform && (
                <Card style={styles.uniformCard}>
                  <Card.Content style={styles.uniformContent}>
                    <MaterialCommunityIcons name="tshirt-crew-outline" size={18} color="#111827" />
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
          {rsvps.filter((r) => r.status === 'going' && r.users).length > 0 && (
            <View style={styles.attendeesSection}>
              <Text variant="bodySmall" style={styles.attendeesLabel}>Going:</Text>
              <Text variant="bodySmall" style={styles.attendeesText}>
                {rsvps
                  .filter((r) => r.status === 'going' && r.users)
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

          {comments.filter((c) => c.users).map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Avatar.Text
                size={32}
                label={`${comment.users.first_name?.[0] || ''}${comment.users.last_name?.[0] || ''}`}
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
        </ScrollView>

        {/* Dock-to-keyboard: Comment input as sticky footer */}
        <View style={[styles.commentInput, { paddingBottom: Math.max(8, insets.bottom) }]}>
          <TextInput
            ref={commentInputRef as any}
            mode="outlined"
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            style={styles.commentTextInput}
            dense
            multiline
            blurOnSubmit={false}
          />
          <IconButton
            icon="send"
            mode="contained"
            onPress={handlePostComment}
            disabled={!commentText.trim() || posting}
            loading={posting}
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 16 },
  adminActions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  editSection: { gap: 12, marginBottom: 8 },
  editInput: { backgroundColor: '#fff' },
  saveButton: { borderRadius: 12, marginTop: 4 },
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
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingHorizontal: 8, paddingTop: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  commentTextInput: { flex: 1, backgroundColor: '#fff', maxHeight: 100 },
});
