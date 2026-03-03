import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

export function useGoogleCalendar(userId: string) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data } = await supabase
      .from('users')
      .select('calendar_tokens')
      .eq('id', userId)
      .single();

    setConnected(!!data?.calendar_tokens);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const connect = useCallback(async () => {
    // Build the Google OAuth URL using the web app's API endpoint
    // The web server handles the OAuth flow and stores tokens
    const webUrl = Constants.expoConfig?.extra?.webUrl || process.env.EXPO_PUBLIC_WEB_URL;
    if (!webUrl) {
      throw new Error('EXPO_PUBLIC_WEB_URL is not configured');
    }

    const authUrl = `${webUrl}/api/auth/google/mobile?userId=${userId}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, 'ambo://gcal-callback');

    if (result.type === 'success') {
      // Re-check connection status after OAuth completes
      await checkStatus();
    }
  }, [userId, checkStatus]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    await supabase
      .from('users')
      .update({ calendar_tokens: null })
      .eq('id', userId);
    setConnected(false);
    setLoading(false);
  }, [userId]);

  return { connected, loading, connect, disconnect, checkStatus };
}
