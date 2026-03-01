import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export function useChatMessages(groupId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('chat_messages')
      .select('*, users:sender_id(first_name, last_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setMessages(((data || []) as ChatMessage[]).filter((m) => m.users != null));
    }
    setLoading(false);
  }, [groupId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!groupId) return;

    fetchMessages();

    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the full message with user info
          const { data } = await supabase
            .from('chat_messages')
            .select('*, users:sender_id(first_name, last_name, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data && (data as ChatMessage).users != null) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data as ChatMessage];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [groupId, fetchMessages]);

  const sendMessage = async (senderId: string, content: string) => {
    const { error: err } = await supabase
      .from('chat_messages')
      .insert({ group_id: groupId, sender_id: senderId, content });
    if (err) throw err;
    // Refetch to ensure message appears even if realtime misses the event
    await fetchMessages();
  };

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
}
