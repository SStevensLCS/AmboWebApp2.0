import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useChatReadStore } from '@/stores/chatReadStore';

export function useBadgeCounts(userId: string, role: 'admin' | 'student') {
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [serverUnreadGroupIds, setServerUnreadGroupIds] = useState<Set<string>>(new Set());
  const readGroups = useChatReadStore((s) => s.readGroups);
  const removeReadGroup = useChatReadStore((s) => s.removeReadGroup);
  // Track group IDs so we can scope the realtime subscription
  const groupIdsRef = useRef<string[]>([]);

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
        groupIdsRef.current = groupIds;

        // Build O(1) lookup map for participant data
        const participantMap = new Map<string, string | null>();
        for (const p of participantData) {
          participantMap.set(p.group_id, (p as any).last_read_at ?? null);
        }

        // Fetch recent messages — limit to reduce data transfer
        const { data: latestMessages } = await supabase
          .from('chat_messages')
          .select('group_id, created_at, sender_id')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false })
          .limit(groupIds.length * 3);

        if (latestMessages) {
          const seenGroups = new Set<string>();
          for (const msg of latestMessages) {
            if (msg.sender_id === userId) continue; // Skip own messages
            if (seenGroups.has(msg.group_id)) continue; // Already found latest for this group
            seenGroups.add(msg.group_id);

            const lastRead = participantMap.get(msg.group_id);
            if (lastRead === undefined) continue; // Not a participant (shouldn't happen)
            if (!lastRead || new Date(msg.created_at) > new Date(lastRead)) {
              unreadGroupIds.add(msg.group_id);
            }
          }
        }
      }
    } catch {
      // Silently fail if last_read_at column doesn't exist
    }

    setServerUnreadGroupIds(unreadGroupIds);

    // Prune optimistic readGroups for groups the server now considers read.
    // This prevents the optimistic set from growing unbounded and keeps
    // badge state in sync without the race condition of clearing all at once.
    const currentReadGroups = useChatReadStore.getState().readGroups;
    for (const gid of currentReadGroups) {
      if (!unreadGroupIds.has(gid)) {
        removeReadGroup(gid);
      }
    }

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
    if (!userId) return;

    fetchCounts();

    // Refresh periodically as a fallback
    const interval = setInterval(fetchCounts, 15000);

    // Subscribe to new chat messages — refetch badge counts on any insert
    const channel = supabase
      .channel(`badge-counts-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          // Refetch if message is from someone else
          if (newMsg.sender_id !== userId) {
            removeReadGroup(newMsg.group_id);
            fetchCounts();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions' },
        () => {
          // Refetch when any submission status changes (approve/deny)
          if (role === 'admin') fetchCounts();
        }
      )
      .subscribe();

    // Refetch when app comes back to foreground
    const appStateListener = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchCounts();
    });

    return () => {
      clearInterval(interval);
      appStateListener.remove();
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
