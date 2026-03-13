import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EventComment, EventRSVP, EventRSVPOption, RSVPStatus } from '@ambo/database';

export function useEventDetail(eventId: string, userId: string) {
  const [comments, setComments] = useState<EventComment[]>([]);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [rsvpOptions, setRsvpOptions] = useState<EventRSVPOption[]>([]);
  const [myRsvp, setMyRsvp] = useState<RSVPStatus | null>(null);
  const [myRsvpOptionId, setMyRsvpOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [commentsRes, rsvpsRes, optionsRes] = await Promise.all([
      supabase
        .from('event_comments')
        .select('*, users(first_name, last_name, role, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
      supabase
        .from('event_rsvps')
        .select('status, user_id, rsvp_option_id, users(first_name, last_name)')
        .eq('event_id', eventId),
      supabase
        .from('event_rsvp_options')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true }),
    ]);

    if (commentsRes.data) setComments((commentsRes.data as unknown as EventComment[]).filter((c: any) => c.users != null));
    if (rsvpsRes.data) {
      setRsvps((rsvpsRes.data as unknown as EventRSVP[]).filter((r: any) => r.users != null));
      const mine = rsvpsRes.data.find((r: any) => r.user_id === userId);
      setMyRsvp(mine ? (mine.status as RSVPStatus) : null);
      setMyRsvpOptionId(mine?.rsvp_option_id || null);
    }
    if (optionsRes.data) setRsvpOptions(optionsRes.data as EventRSVPOption[]);
    setLoading(false);
  }, [eventId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateRsvp = useCallback(
    async (status: RSVPStatus, rsvpOptionId?: string) => {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status,
            ...(rsvpOptionId !== undefined && { rsvp_option_id: rsvpOptionId }),
          },
          { onConflict: 'event_id,user_id' }
        );

      if (!error) {
        setMyRsvp(status);
        setMyRsvpOptionId(rsvpOptionId || null);
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

  return { comments, rsvps, rsvpOptions, myRsvp, myRsvpOptionId, loading, refetch: fetchData, updateRsvp, postComment };
}
