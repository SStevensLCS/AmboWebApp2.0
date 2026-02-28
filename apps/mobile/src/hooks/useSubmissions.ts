import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Submission } from '@ambo/database';

interface SubmissionWithUser extends Submission {
  users?: { first_name: string; last_name: string; email: string };
}

export function useSubmissions(userId?: string) {
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('submissions')
      .select('*, users(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setSubmissions((data as SubmissionWithUser[]) || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { submissions, loading, error, refetch: fetch };
}
