import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
}

export function useChatGroups(userId: string) {
  const [groups, setGroups] = useState<ChatGroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    // Get groups the user participates in
    const { data: participantData, error: pErr } = await supabase
      .from('chat_participants')
      .select('group_id')
      .eq('user_id', userId);

    if (pErr) {
      setError(pErr.message);
      setLoading(false);
      return;
    }

    const groupIds = (participantData || []).map((p) => p.group_id);
    if (groupIds.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
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

      return { ...group, participants, lastMessage: lastMessage || undefined };
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
    // Generate ID client-side to avoid needing .select() after insert.
    // The SELECT policy on chat_groups requires the user to be a participant,
    // but participants haven't been inserted yet at this point.
    const groupId = generateUUID();

    const { error: err } = await supabase
      .from('chat_groups')
      .insert({ id: groupId, name, created_by: userId });
    if (err) throw err;

    const rows = participantIds.map((uid) => ({ group_id: groupId, user_id: uid }));
    // Include the creator as a participant
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
