import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@ambo/database';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('users')
      .select('id, first_name, last_name, phone, email, role, avatar_url')
      .order('last_name', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setUsers((data as User[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { users, loading, error, refetch: fetch };
}
