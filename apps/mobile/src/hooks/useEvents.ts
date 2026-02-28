import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { EventDetails } from '@ambo/database';

export function useEvents() {
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('events')
      .select('*, users!created_by(role)')
      .order('start_time', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setEvents((data as EventDetails[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { events, loading, error, refetch: fetch };
}
