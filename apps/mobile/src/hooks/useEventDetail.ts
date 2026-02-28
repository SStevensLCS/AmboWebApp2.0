import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EventComment, EventRSVP, RSVPStatus } from '@ambo/database';

export function useEventDetail(eventId: string, userId: string) {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [myRsvp, setMyRsvp] = useState<RSVPStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [commentsRes, rsvpsRes] = await Promise.all([
      supabase
        .from('event_comments')
        .select('*, users(first_name, last_name, role, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
      supabase
        .from('event_rsvps')
        .select('status, user_id, users(first_name, last_name)')
        .eq('event_id', eventId),
    ]);

    if (commentsRes.data) setComments(commentsRes.data as unknown as EventComment[]);
    if (rsvpsRes.data) {
      setRsvps(rsvpsRes.data as unknown as EventRSVP[]);
      const mine = rsvpsRes.data.find((r: any) => r.user_id === userId);
      setMyRsvp(mine ? (mine.status as RSVPStatus) : null);
    }
    setLoading(false);
  }, [eventId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateRsvp = useCallback(
    async (status: RSVPStatus) => {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: 'event_id,user_id' });

      if (!error) {
        setMyRsvp(status);
        await fetchData();
      }
      return error;
    },
    [eventId, userId, fetchData]
  );

  const postComment = useCallback(
    async (content: string) => {
      const { error } = await supabase
        .from('event_comments')
        .insert({ event_id: eventId, user_id: userId, content });

      if (!error) await fetchData();
      return error;
    },
    [eventId, userId, fetchData]
  );

  return { comments, rsvps, myRsvp, loading, refetch: fetchData, updateRsvp, postComment };
}
