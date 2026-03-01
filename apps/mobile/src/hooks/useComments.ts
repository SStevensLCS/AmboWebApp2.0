import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@ambo/database';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  users: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: UserRole;
  };
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('comments')
      .select('*, users(first_name, last_name, avatar_url, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setComments(((data || []) as Comment[]).filter((c) => c.users != null));
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = async (userId: string, content: string) => {
    const { error: err } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content });
    if (err) throw err;
    await fetchComments();
  };

  const editComment = async (commentId: string, content: string) => {
    const { error: err } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId);
    if (err) throw err;
    await fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    const { error: err } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    if (err) throw err;
    await fetchComments();
  };

  return { comments, loading, error, refetch: fetchComments, createComment, editComment, deleteComment };
}
