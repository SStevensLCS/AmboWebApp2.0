import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EventComment, EventRSVP, EventRSVPOption, RSVPStatus } from '@ambo/database';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || '';

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

  /** Fire-and-forget Google Calendar sync via the web API */
  const triggerGcalSync = useCallback(async () => {
    if (!WEB_URL) {
      console.log('[GCal] No WEB_URL configured — skipping sync');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('[GCal] No access token — skipping sync');
        return;
      }
      console.log('[GCal] Triggering sync for event', eventId, '→', `${WEB_URL}/api/events/${eventId}/gcal-sync`);
      fetch(`${WEB_URL}/api/events/${eventId}/gcal-sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (body.synced) {
            console.log('[GCal] ✅ Sync succeeded for event', eventId);
          } else {
            console.warn('[GCal] ❌ Sync failed:', body.reason || `HTTP ${res.status}`);
          }
        })
        .catch((err) => console.warn('[GCal] ❌ Sync request error:', err?.message || err));
    } catch {
      // silently ignore — GCal sync is best-effort
    }
  }, [eventId]);

  /** Remove RSVP entirely (toggle-off) */
  const removeRsvp = useCallback(async () => {
    // Optimistic: clear immediately
    const prevMyRsvp = myRsvp;
    const prevMyRsvpOptionId = myRsvpOptionId;
    const prevRsvps = rsvps;
    setMyRsvp(null);
    setMyRsvpOptionId(null);
    setRsvps(rsvps.filter((r: any) => r.user_id !== userId));

    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      // Revert on failure
      setMyRsvp(prevMyRsvp);
      setMyRsvpOptionId(prevMyRsvpOptionId);
      setRsvps(prevRsvps);
      return error;
    }

    await fetchData();
    triggerGcalSync();
    return null;
  }, [eventId, userId, fetchData, triggerGcalSync, myRsvp, myRsvpOptionId, rsvps]);

  const updateRsvp = useCallback(
    async (status: RSVPStatus, rsvpOptionId?: string) => {
      // Toggle-off: if tapping the same status (and same option for custom), remove RSVP
      const sameStatus = status === myRsvp;
      const sameOption = rsvpOptionId === myRsvpOptionId || (!rsvpOptionId && !myRsvpOptionId);
      if (sameStatus && sameOption) {
        return removeRsvp();
      }

      // Optimistic update — immediately reflect the change in UI
      const prevMyRsvp = myRsvp;
      const prevMyRsvpOptionId = myRsvpOptionId;
      const prevRsvps = rsvps;
      setMyRsvp(status);
      setMyRsvpOptionId(rsvpOptionId || null);

      // Optimistically update the rsvps array for counts
      const existingIdx = rsvps.findIndex((r: any) => r.user_id === userId);
      if (existingIdx >= 0) {
        const updated = [...rsvps];
        updated[existingIdx] = { ...updated[existingIdx], status, rsvp_option_id: rsvpOptionId || null } as any;
        setRsvps(updated);
      }

      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          {
            event_id: eventId,
            user_id: userId,
            status,
            rsvp_option_id: rsvpOptionId || null,
          },
          { onConflict: 'event_id,user_id' }
        );

      if (error) {
        // Revert optimistic update on failure
        setMyRsvp(prevMyRsvp);
        setMyRsvpOptionId(prevMyRsvpOptionId);
        setRsvps(prevRsvps);
        return error;
      }

      // Refetch to get server-truth (includes any new RSVPs from others)
      await fetchData();

      // Trigger Google Calendar sync in background
      triggerGcalSync();

      return null;
    },
    [eventId, userId, fetchData, triggerGcalSync, myRsvp, myRsvpOptionId, rsvps, removeRsvp]
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

  return { comments, rsvps, rsvpOptions, myRsvp, myRsvpOptionId, loading, refetch: fetchData, updateRsvp, removeRsvp, postComment };
}
