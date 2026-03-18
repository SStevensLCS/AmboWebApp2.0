import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || '';

/**
 * Hook for managing the org-wide admin Google Calendar connection.
 * This is separate from useGoogleCalendar (personal/student calendar).
 *
 * - Status is checked via GET /api/auth/google/status (Bearer token)
 * - Connect opens OAuth flow via /api/auth/google/admin-mobile
 * - Disconnect calls DELETE /api/auth/google/status
 * - Tokens are stored in system_settings table (org-wide)
 */
export function useAdminGoogleCalendar() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const checkStatus = useCallback(async () => {
    if (!WEB_URL) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${WEB_URL}/api/auth/google/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
      }
    } catch (err) {
      console.warn('[AdminGCal] Failed to check status:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const connect = useCallback(async () => {
    if (!WEB_URL) {
      throw new Error('EXPO_PUBLIC_WEB_URL is not configured');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const authUrl = `${WEB_URL}/api/auth/google/admin-mobile?token=${token}`;
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      'ambo://gcal-admin-callback'
    );

    if (result.type === 'success') {
      await checkStatus();
    }
  }, [getToken, checkStatus]);

  const disconnect = useCallback(async () => {
    if (!WEB_URL) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${WEB_URL}/api/auth/google/status`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setConnected(false);
      }
    } catch (err) {
      console.warn('[AdminGCal] Failed to disconnect:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return { connected, loading, connect, disconnect, checkStatus };
}
