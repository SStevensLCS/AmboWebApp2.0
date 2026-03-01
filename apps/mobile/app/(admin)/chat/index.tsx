import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Avatar, Text, FAB } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useChatGroups, ChatGroupWithMeta } from '@/hooks/useChatGroups';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';

function getGroupDisplayName(group: ChatGroupWithMeta, currentUserId: string): string {
  if (group.name) return group.name;
  const others = group.participants
    .filter((p) => p.user_id !== currentUserId && p.users)
    .map((p) => p.users.first_name);
  return others.length > 0 ? others.join(', ') : 'Chat';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function AdminChatList() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { groups, loading, refetch } = useChatGroups(userId);

  // Refetch when screen regains focus (e.g. returning from a chat thread or new chat)
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (loading && groups.length === 0) return <LoadingScreen />;

  const renderGroup = ({ item }: { item: ChatGroupWithMeta }) => {
    const displayName = getGroupDisplayName(item, userId);
    const otherParticipant = item.participants.find((p) => p.user_id !== userId && p.users);
    const initials = otherParticipant
      ? `${otherParticipant.users.first_name?.[0] || ''}${otherParticipant.users.last_name?.[0] || ''}`
      : '?';
    const avatarUrl = otherParticipant?.users?.avatar_url;

    return (
      <Pressable style={styles.groupRow} onPress={() => router.push(`/(admin)/chat/${item.id}`)}>
        {avatarUrl ? (
          <Avatar.Image size={44} source={{ uri: avatarUrl }} />
        ) : (
          <Avatar.Text size={44} label={initials} style={styles.avatarFallback} />
        )}
        <View style={styles.groupInfo}>
          <Text variant="bodyLarge" style={styles.groupName} numberOfLines={1}>{displayName}</Text>
          {item.lastMessage && (
            <Text variant="bodySmall" style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.content}
            </Text>
          )}
        </View>
        {item.lastMessage && (
          <Text variant="bodySmall" style={styles.time}>{formatDate(item.lastMessage.created_at)}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={<EmptyState icon="chat-outline" title="No conversations" subtitle="Start a new chat to get started" />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/(admin)/chat/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatarFallback: { backgroundColor: '#e5e7eb' },
  groupInfo: { flex: 1 },
  groupName: { fontWeight: '600' },
  lastMessage: { color: '#6b7280', marginTop: 2 },
  time: { color: '#9ca3af' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 72 },
  emptyContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#3b82f6',
  },
});
