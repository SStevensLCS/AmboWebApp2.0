import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface BadgeCounts {
  unreadChats: number;
  pendingSubmissions: number;
}

export function useBadgeCounts(userId: string, role: 'admin' | 'student') {
  const [counts, setCounts] = useState<BadgeCounts>({ unreadChats: 0, pendingSubmissions: 0 });

  const fetchCounts = useCallback(async () => {
    if (!userId) return;

    // Fetch unread chat count
    let unreadChats = 0;
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
                unreadChats++;
              }
            }
          }
        }
      }
    } catch {
      // Silently fail if last_read_at column doesn't exist
    }

    // Fetch pending submissions count (admin sees all, student sees own)
    let pendingSubmissions = 0;
    if (role === 'admin') {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Pending');
      pendingSubmissions = count || 0;
    }

    setCounts({ unreadChats, pendingSubmissions });
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

  return { ...counts, refetch: fetchCounts };
}
