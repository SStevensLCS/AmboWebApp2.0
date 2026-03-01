import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@ambo/database';

export interface Post {
  id: string;
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
  comments: { count: number }[];
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('posts')
      .select('*, users(first_name, last_name, avatar_url, role), comments(count)')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setPosts(((data || []) as Post[]).filter((p) => p.users != null));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (userId: string, content: string) => {
    const { error: err } = await supabase
      .from('posts')
      .insert({ user_id: userId, content });
    if (err) throw err;
    await fetchPosts();
  };

  const editPost = async (postId: string, content: string) => {
    const { error: err } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', postId);
    if (err) throw err;
    await fetchPosts();
  };

  const deletePost = async (postId: string) => {
    const { error: err } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    if (err) throw err;
    await fetchPosts();
  };

  return { posts, loading, error, refetch: fetchPosts, createPost, editPost, deletePost };
}
