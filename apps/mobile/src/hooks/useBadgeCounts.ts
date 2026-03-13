import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatReadStore } from '@/stores/chatReadStore';

interface BadgeCounts {
  unreadChats: number;
  pendingSubmissions: number;
}

export function useBadgeCounts(userId: string, role: 'admin' | 'student') {
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [serverUnreadGroupIds, setServerUnreadGroupIds] = useState<Set<string>>(new Set());
  const readGroups = useChatReadStore((s) => s.readGroups);

  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    // Fetch unread chat groups from server
    const unreadGroupIds = new Set<string>();
    try {
      const { data: participantData } = await supabase
        .from('chat_participants')
        .select('group_id, last_read_at')
        .eq('user_id', userId);

      if (participantData && participantData.length > 0) {
        const groupIds = participantData.map((p: any) => p.group_id);
        const { data: latestMessages } = await supabase
          .from('chat_messages')
          .select('group_id, created_at')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false });

        if (latestMessages) {
          const seenGroups = new Set<string>();
          for (const msg of latestMessages) {
            if (seenGroups.has(msg.group_id)) continue;
            seenGroups.add(msg.group_id);
            const participant = participantData.find((p: any) => p.group_id === msg.group_id);
            if (participant) {
              const lastRead = participant.last_read_at;
              if (!lastRead || new Date(msg.created_at) > new Date(lastRead)) {
                unreadGroupIds.add(msg.group_id);
              }
            }
          }
        }
      }
    } catch {
      // Silently fail if last_read_at column doesn't exist
    }

    setServerUnreadGroupIds(unreadGroupIds);

    // Fetch pending submissions count (admin sees all, student sees own)
    if (role === 'admin') {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Pending');
      setPendingSubmissions(count || 0);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchCounts();

    // Refresh periodically as a fallback
    const interval = setInterval(fetchCounts, 30000);

    // Subscribe to new chat messages for instant badge updates
    const channel = supabase
      .channel(`badge-counts-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchCounts, userId]);

  // Derive adjusted unread count: server unread minus optimistically-read groups
  // This recomputes instantly when readGroups changes (no server round-trip needed)
  let unreadChats = 0;
  for (const gid of serverUnreadGroupIds) {
    if (!readGroups.has(gid)) unreadChats++;
  }

  return { unreadChats, pendingSubmissions, refetch: fetchCounts };
}
