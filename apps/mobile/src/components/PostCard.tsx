import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import type { UserRole } from '@ambo/database';
import { RoleBadge } from './RoleBadge';

interface PostCardProps {
  id: string;
  content: string;
  createdAt: string;
  author: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: UserRole;
  };
  commentCount: number;
  onPress: () => void;
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

export function PostCard({ content, createdAt, author, commentCount, onPress }: PostCardProps) {
  const initials = `${author.first_name?.[0] || ''}${author.last_name?.[0] || ''}`;

  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityLabel={`Post by ${author.first_name} ${author.last_name}, ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`} accessibilityRole="button">
      <View style={styles.header}>
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
      <Text variant="bodyMedium" style={styles.content} numberOfLines={3}>
        {content}
      </Text>
      <Text variant="bodySmall" style={styles.commentCount}>
        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
      </Text>
    </Pressable>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarFallback: { backgroundColor: '#e5e7eb' },
  authorInfo: { gap: 2, flex: 1 },
  authorName: { fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timestamp: { color: '#9ca3af', fontSize: 12 },
  content: { marginTop: 10, lineHeight: 20 },
  commentCount: { marginTop: 10, color: '#6b7280', fontWeight: '500' },
});
