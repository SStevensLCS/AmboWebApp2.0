import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { useChatMessages, ChatMessage } from '@/hooks/useChatMessages';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from 'react-native-paper';
import { supabase } from '@/lib/supabase';

export default function AdminMessageThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { messages, loading, sendMessage } = useChatMessages(id || '');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [groupName, setGroupName] = useState('Messages');

  // Fetch group name for the header
  useEffect(() => {
    if (!id) return;
    async function fetchGroupName() {
      const { data: group } = await supabase
        .from('chat_groups')
        .select('name')
        .eq('id', id)
        .single();

      if (group?.name) {
        setGroupName(group.name);
        return;
      }

      // If no explicit name, build from participant names
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, users(first_name, last_name)')
        .eq('group_id', id);

      if (participants) {
        const others = participants
          .filter((p: any) => p.user_id !== userId && p.users)
          .map((p: any) => p.users.first_name);
        if (others.length > 0) {
          setGroupName(others.join(', '));
        }
      }
    }
    fetchGroupName();
  }, [id, userId]);

  // Mark messages as read when entering the chat (gracefully handles missing column)
  useEffect(() => {
    if (!id || !userId) return;
    supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('group_id', id)
      .eq('user_id', userId)
      .then(() => {})
      .catch(() => {}); // Silently fail if last_read_at column doesn't exist yet
  }, [id, userId, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (loading && messages.length === 0) return <LoadingScreen />;

  const handleSend = async (text: string) => {
    await sendMessage(userId, text);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.sender_id === userId;
    const senderName = item.users
      ? `${item.users.first_name} ${item.users.last_name}`
      : 'Unknown';
    return (
      <MessageBubble
        content={item.content}
        createdAt={item.created_at}
        senderName={senderName}
        senderAvatar={item.users?.avatar_url}
        isOwn={isOwn}
      />
    );
  };

  // Header (~44) + top safe area inset gives the correct offset
  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 44 : 0;

  return (
    <>
      <Stack.Screen options={{
        title: groupName,
        headerRight: () => (
          <IconButton icon="dots-vertical" onPress={() => router.push({ pathname: '/(admin)/chat/edit', params: { id } })} />
        ),
      }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={keyboardOffset}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={<EmptyState icon="chat-outline" title="No messages yet" subtitle="Send the first message!" />}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingVertical: 12 },
  emptyContainer: { flex: 1 },
});
