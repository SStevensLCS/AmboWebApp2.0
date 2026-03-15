import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Submission } from '@ambo/database';

const PAGE_SIZE = 20;

interface SubmissionWithUser extends Submission {
  users?: { first_name: string; last_name: string; email: string };
}

export function useSubmissions(userId?: string) {
  const [submissions, setSubmissions] = useState<SubmissionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('submissions')
      .select('*, users(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setSubmissions((data as SubmissionWithUser[]) || []);
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoading(false);
  }, [userId]);

  const fetchMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;

    let query = supabase
      .from('submissions')
      .select('*, users(first_name, last_name, email)')
      .order('created_at', { ascending: false })
      .range(submissions.length, submissions.length + PAGE_SIZE - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error: err } = await query;

    if (!err && data) {
      setSubmissions((prev) => [...prev, ...(data as SubmissionWithUser[])]);
      setHasMore(data.length === PAGE_SIZE);
    }
    loadingMoreRef.current = false;
  }, [userId, submissions.length, hasMore]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { submissions, loading, error, hasMore, refetch: fetch, fetchMore };
}
