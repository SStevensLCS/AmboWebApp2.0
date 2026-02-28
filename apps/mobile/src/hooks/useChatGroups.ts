import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
        .filter((p) => p.group_id === group.id)
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
    const { data: group, error: err } = await supabase
      .from('chat_groups')
      .insert({ name, created_by: userId })
      .select()
      .single();
    if (err) throw err;

    const rows = participantIds.map((uid) => ({ group_id: group.id, user_id: uid }));
    // Include the creator as a participant
    if (!participantIds.includes(userId)) {
      rows.push({ group_id: group.id, user_id: userId });
    }

    const { error: pErr } = await supabase.from('chat_participants').insert(rows);
    if (pErr) throw pErr;

    await fetchGroups();
    return group.id as string;
  };

  return { groups, loading, error, refetch: fetchGroups, createGroup };
}
