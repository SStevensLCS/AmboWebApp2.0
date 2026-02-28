import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Application {
  id: string;
  phone_number: string;
  status: ApplicationStatus;
  current_step: number;
  first_name: string;
  last_name: string;
  email: string;
  grade_current?: string;
  grade_entry?: string;
  gpa?: string;
  transcript_url?: string;
  referrer_1_name?: string;
  referrer_1_email?: string;
  referrer_2_name?: string;
  referrer_2_email?: string;
  question_1?: string;
  question_2?: string;
  question_3?: string;
  question_4?: string;
  question_5?: string;
  question_6?: string;
  question_7?: string;
  question_8?: string;
  question_9?: string;
  created_at: string;
  updated_at?: string;
}

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setApplications((data as Application[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (applicationId: string, status: ApplicationStatus) => {
    const { error: err } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId);
    if (err) throw err;
    await fetchApplications();
  };

  return { applications, loading, error, refetch: fetchApplications, updateStatus };
}
