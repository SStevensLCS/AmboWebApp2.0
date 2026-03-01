import React, { useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useChatMessages, ChatMessage } from '@/hooks/useChatMessages';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';

export default function AdminMessageThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { messages, loading, sendMessage } = useChatMessages(id || '');
  const flatListRef = useRef<FlatList>(null);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingVertical: 12 },
  emptyContainer: { flex: 1 },
});
