import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatReadStore } from '@/stores/chatReadStore';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface ChatGroup {
  id: string;
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ChatGroupWithMeta extends ChatGroup {
  participants: { user_id: string; users: { first_name: string; last_name: string; avatar_url?: string } }[];
  lastMessage?: { content: string; created_at: string };
  hasUnread?: boolean;
}

export function useChatGroups(userId: string) {
  const [groups, setGroups] = useState<ChatGroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    // Try to fetch with last_read_at, fall back to without it if the column doesn't exist yet
    let participantData: any[] | null = null;
    let hasLastReadAt = true;

    const { data: pData, error: pErr } = await supabase
      .from('chat_participants')
      .select('group_id, last_read_at')
      .eq('user_id', userId);

    if (pErr) {
      // Column might not exist yet (migration not applied) - fall back to basic query
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('chat_participants')
        .select('group_id')
        .eq('user_id', userId);

      if (fallbackErr) {
        setError(fallbackErr.message);
        setLoading(false);
        return;
      }
      participantData = fallbackData;
      hasLastReadAt = false;
    } else {
      participantData = pData;
    }

    const groupIds = (participantData || []).map((p: any) => p.group_id);
    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Build a map of group_id -> last_read_at for unread detection
    const lastReadMap: Record<string, string | null> = {};
    if (hasLastReadAt) {
      for (const p of participantData || []) {
        lastReadMap[p.group_id] = p.last_read_at ?? null;
      }
    }

    // Fetch group details with participants
    const { data: groupData, error: gErr } = await supabase
      .from('chat_groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (gErr) {
      setError(gErr.message);
      setLoading(false);
      return;
    }

    // Fetch participants for these groups
    const { data: allParticipants } = await supabase
      .from('chat_participants')
      .select('group_id, user_id, users(first_name, last_name, avatar_url)')
      .in('group_id', groupIds);

    // Fetch last message per group
    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('group_id, content, created_at')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false });

    const result: ChatGroupWithMeta[] = (groupData || []).map((group) => {
      const participants = (allParticipants || [])
        .filter((p) => p.group_id === group.id && p.users != null)
        .map((p) => ({ user_id: p.user_id, users: p.users as unknown as { first_name: string; last_name: string; avatar_url?: string } }));

      const lastMessage = (lastMessages || []).find((m) => m.group_id === group.id);

      // Determine unread status (only if last_read_at column exists)
      let hasUnread = false;
      if (hasLastReadAt && lastMessage) {
        const lastReadAt = lastReadMap[group.id];
        hasUnread = !lastReadAt || new Date(lastMessage.created_at) > new Date(lastReadAt);
      }

      // Apply optimistic override: if user has opened this group, mark as read
      const optimisticReadGroups = useChatReadStore.getState().readGroups;
      if (optimisticReadGroups.has(group.id)) {
        hasUnread = false;
      }

      return { ...group, participants, lastMessage: lastMessage || undefined, hasUnread };
    });

    // Sort by last message time or group updated_at
    result.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.updated_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.updated_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setGroups(result);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string | null, participantIds: string[]) => {
    const groupId = generateUUID();

    const { error: err } = await supabase
      .from('chat_groups')
      .insert({ id: groupId, name, created_by: userId });
    if (err) throw err;

    const rows = participantIds.map((uid) => ({ group_id: groupId, user_id: uid }));
    if (!participantIds.includes(userId)) {
      rows.push({ group_id: groupId, user_id: userId });
    }

    const { error: pErr } = await supabase.from('chat_participants').insert(rows);
    if (pErr) throw pErr;

    await fetchGroups();
    return groupId;
  };

  return { groups, loading, error, refetch: fetchGroups, createGroup };
}
