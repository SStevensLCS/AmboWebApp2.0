import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Avatar, Text, TextInput, Button, IconButton, Divider } from 'react-native-paper';
import type { UserRole } from '@ambo/database';
import { RoleBadge } from './RoleBadge';
import { useComments, Comment } from '@/hooks/useComments';

interface PostCardProps {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: UserRole;
  };
  commentCount: number;
  currentUserId: string;
  currentUserRole: UserRole;
  onEdit: (postId: string, content: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
}

function canModify(
  targetUserId: string,
  targetRole: UserRole,
  currentUserId: string,
  currentUserRole: UserRole
): boolean {
  if (currentUserId === targetUserId) return true;
  if (currentUserRole === 'superadmin') return true;
  if (currentUserRole === 'admin' && (targetRole === 'student' || targetRole === 'basic')) return true;
  return false;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PostCard({
  id,
  userId,
  content,
  createdAt,
  author,
  commentCount,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [saving, setSaving] = useState(false);

  const { comments, loading: commentsLoading, createComment, editComment, deleteComment } = useComments(
    expanded ? id : ''
  );

  const showActions = canModify(userId, author.role, currentUserId, currentUserRole);
  const initials = `${author.first_name?.[0] || ''}${author.last_name?.[0] || ''}`;

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onEdit(id, editText.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await createComment(currentUserId, replyText.trim());
      setReplyText('');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    setSaving(true);
    try {
      await editComment(commentId, editCommentText.trim());
      setEditingCommentId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          {author.avatar_url ? (
            <Avatar.Image size={36} source={{ uri: author.avatar_url }} />
          ) : (
            <Avatar.Text size={36} label={initials} style={styles.avatarFallback} />
          )}
          <View style={styles.authorInfo}>
            <Text variant="bodyMedium" style={styles.authorName}>
              {author.first_name} {author.last_name}
            </Text>
            <View style={styles.metaRow}>
              <RoleBadge role={author.role} />
              <Text variant="bodySmall" style={styles.timestamp}>
                {formatTimeAgo(createdAt)}
              </Text>
            </View>
          </View>
        </View>
        {showActions && (
          <View style={styles.actions}>
            <IconButton icon="pencil-outline" size={18} onPress={() => { setEditing(true); setEditText(content); }} />
            <IconButton icon="delete-outline" size={18} iconColor="#ef4444" onPress={() => onDelete(id)} />
          </View>
        )}
      </View>

      {/* Content or edit mode */}
      {editing ? (
        <View style={styles.editSection}>
          <TextInput
            mode="outlined"
            value={editText}
            onChangeText={setEditText}
            multiline
            dense
          />
          <View style={styles.editActions}>
            <Button mode="text" onPress={() => setEditing(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveEdit} loading={saving} disabled={!editText.trim()}>
              Save
            </Button>
          </View>
        </View>
      ) : (
        <Text variant="bodyMedium" style={styles.content}>{content}</Text>
      )}

      {/* Comments toggle */}
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.commentToggle}>
        <Text variant="bodySmall" style={styles.commentToggleText}>
          {expanded ? 'Hide' : 'View'} Comments ({commentCount})
        </Text>
      </Pressable>

      {/* Expanded comments */}
      {expanded && (
        <View style={styles.commentsSection}>
          <Divider style={styles.commentDivider} />
          {commentsLoading ? (
            <Text variant="bodySmall" style={styles.loadingText}>Loading comments...</Text>
          ) : comments.length === 0 ? (
            <Text variant="bodySmall" style={styles.noComments}>No comments yet</Text>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                editingCommentId={editingCommentId}
                editCommentText={editCommentText}
                saving={saving}
                onStartEdit={(c) => { setEditingCommentId(c.id); setEditCommentText(c.content); }}
                onCancelEdit={() => setEditingCommentId(null)}
                onSaveEdit={handleSaveCommentEdit}
                onDelete={deleteComment}
                setEditCommentText={setEditCommentText}
              />
            ))
          )}

          {/* Reply input */}
          <View style={styles.replyRow}>
            <TextInput
              mode="outlined"
              placeholder="Write a comment..."
              value={replyText}
              onChangeText={setReplyText}
              dense
              style={styles.replyInput}
            />
            <IconButton
              icon="send"
              mode="contained"
              size={18}
              onPress={handleReply}
              disabled={!replyText.trim() || saving}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  editingCommentId,
  editCommentText,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  setEditCommentText,
}: {
  comment: Comment;
  currentUserId: string;
  currentUserRole: UserRole;
  editingCommentId: string | null;
  editCommentText: string;
  saving: boolean;
  onStartEdit: (c: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  setEditCommentText: (t: string) => void;
}) {
  const canAct = canModify(comment.user_id, comment.users.role, currentUserId, currentUserRole);
  const isEditing = editingCommentId === comment.id;
  const initials = `${comment.users.first_name?.[0] || ''}${comment.users.last_name?.[0] || ''}`;

  return (
    <View style={styles.commentRow}>
      {comment.users.avatar_url ? (
        <Avatar.Image size={28} source={{ uri: comment.users.avatar_url }} />
      ) : (
        <Avatar.Text size={28} label={initials} style={styles.avatarFallback} labelStyle={{ fontSize: 11 }} />
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text variant="labelMedium" style={styles.commentAuthor}>
            {comment.users.first_name} {comment.users.last_name}
          </Text>
          <Text variant="bodySmall" style={styles.timestamp}>
            {formatTimeAgo(comment.created_at)}
          </Text>
        </View>
        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput mode="outlined" value={editCommentText} onChangeText={setEditCommentText} dense multiline />
            <View style={styles.editActions}>
              <Button mode="text" onPress={onCancelEdit} compact>Cancel</Button>
              <Button mode="contained" onPress={() => onSaveEdit(comment.id)} loading={saving} compact disabled={!editCommentText.trim()}>Save</Button>
            </View>
          </View>
        ) : (
          <Text variant="bodySmall">{comment.content}</Text>
        )}
      </View>
      {canAct && !isEditing && (
        <View style={styles.commentActions}>
          <IconButton icon="pencil-outline" size={14} onPress={() => onStartEdit(comment)} />
          <IconButton icon="delete-outline" size={14} iconColor="#ef4444" onPress={() => onDelete(comment.id)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarFallback: { backgroundColor: '#e5e7eb' },
  authorInfo: { gap: 2, flex: 1 },
  authorName: { fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timestamp: { color: '#9ca3af', fontSize: 12 },
  actions: { flexDirection: 'row' },
  content: { marginTop: 10, lineHeight: 20 },
  editSection: { marginTop: 8, gap: 8 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  commentToggle: { marginTop: 12 },
  commentToggleText: { color: '#3b82f6', fontWeight: '600' },
  commentsSection: { marginTop: 4 },
  commentDivider: { marginVertical: 8 },
  loadingText: { color: '#9ca3af', paddingVertical: 8 },
  noComments: { color: '#9ca3af', paddingVertical: 8 },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  commentAuthor: { fontWeight: '600' },
  commentActions: { flexDirection: 'row' },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  replyInput: { flex: 1 },
});
