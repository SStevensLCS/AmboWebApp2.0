import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export function usePushNotifications(userId: string) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Check current permission status
  const checkPermission = useCallback(async () => {
    if (!Device.isDevice) {
      setPermissionStatus('denied');
      setLoading(false);
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
    return status;
  }, []);

  // Register for push notifications and store token
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) return null;

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus === 'granted' ? 'granted' : 'denied');

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;
    setExpoPushToken(token);

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#111827',
      });
    }

    // Store token in database
    if (userId && token) {
      await supabase
        .from('expo_push_tokens')
        .upsert(
          { user_id: userId, token },
          { onConflict: 'token' }
        )
        .then(() => {})
        .catch(() => {});
    }

    return token;
  }, [userId]);

  // Remove push token (e.g., on sign out)
  const unregister = useCallback(async () => {
    if (expoPushToken && userId) {
      await supabase
        .from('expo_push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', expoPushToken)
        .then(() => {})
        .catch(() => {});
    }
    setExpoPushToken(null);
  }, [expoPushToken, userId]);

  // On mount, check permission and set up listeners
  useEffect(() => {
    checkPermission().then((status) => {
      if (status === 'granted' && userId) {
        registerForPushNotifications();
      }
      setLoading(false);
    });

    // Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Notification received in foreground - handled by setNotificationHandler above
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      // Could navigate to relevant screen based on notification data
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId, checkPermission, registerForPushNotifications]);

  return {
    permissionStatus,
    expoPushToken,
    loading,
    requestPermission: registerForPushNotifications,
    unregister,
  };
}
