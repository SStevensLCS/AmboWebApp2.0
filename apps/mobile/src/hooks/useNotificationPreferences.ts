import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface NotificationPreferences {
  chat_messages: boolean;
  new_posts: boolean;
  post_comments: boolean;
  event_comments: boolean;
}

const DEFAULTS: NotificationPreferences = {
  chat_messages: true,
  new_posts: true,
  post_comments: true,
  event_comments: true,
};

export function useNotificationPreferences(userId: string) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data } = await supabase
      .from('notification_preferences')
      .select('chat_messages, new_posts, post_comments, event_comments')
      .eq('user_id', userId)
      .single();

    if (data) {
      setPrefs({
        chat_messages: data.chat_messages ?? true,
        new_posts: data.new_posts ?? true,
        post_comments: data.post_comments ?? true,
        event_comments: data.event_comments ?? true,
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePref = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      const updated = { ...prefs, [key]: value };
      setPrefs(updated);

      await supabase
        .from('notification_preferences')
        .upsert(
          { user_id: userId, ...updated, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    },
    [userId, prefs]
  );

  return { prefs, loading, updatePref, refetch: fetchPrefs };
}
