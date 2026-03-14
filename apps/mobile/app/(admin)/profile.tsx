import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking, Platform, Pressable } from 'react-native';
import { Card, Text, Button, Divider, TextInput, Switch, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { RoleBadge } from '@/components/RoleBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AvatarUpload } from '@/components/AvatarUpload';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

export default function AdminProfile() {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id || '';
  const { user, loading, refetch } = useProfile(userId);
  const { prefs, loading: prefsLoading, updatePref } = useNotificationPreferences(userId);
  const { connected: gcalConnected, loading: gcalLoading, connect: gcalConnect, disconnect: gcalDisconnect } = useGoogleCalendar(userId);
  const { permissionStatus, loading: pushLoading, requestPermission } = usePushNotifications(userId);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (!user) return;
    const changed =
      firstName !== (user.first_name || '') ||
      lastName !== (user.last_name || '') ||
      email !== (user.email || '') ||
      phone !== (user.phone || '');
    setHasChanges(changed);
  }, [firstName, lastName, email, phone, user]);

  const handleSave = async () => {
    if (phone && !/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      })
      .eq('id', userId);

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Profile updated.');
      refetch();
    }
  };

  const handleGCalConnect = async () => {
    try {
      await gcalConnect();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to connect Google Calendar.');
    }
  };

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data including submissions, posts, comments, and messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              const accessToken = currentSession?.access_token;
              if (!accessToken) {
                Alert.alert('Error', 'You must be signed in to delete your account.');
                setDeleting(false);
                return;
              }

              const baseUrl = process.env.EXPO_PUBLIC_WEB_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
              if (!baseUrl) {
                Alert.alert('Error', 'Server URL is not configured.');
                setDeleting(false);
                return;
              }

              const res = await fetch(`${baseUrl}/api/mobile/delete-account`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete account');
              }

              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [signOut]);

  if (loading) return <LoadingScreen />;

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
    : '?';

  const displayAvatar = avatarUrl || user?.avatar_url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Avatar & Role */}
      <View style={styles.avatarSection}>
        <AvatarUpload
          userId={userId}
          avatarUrl={displayAvatar}
          initials={initials}
          onUploaded={(url) => { setAvatarUrl(url); refetch(); }}
        />
        {user?.role && <RoleBadge role={user.role} />}
      </View>

      <Divider style={styles.divider} />

      {/* Editable Profile Fields */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Profile Information</Text>
      <View style={styles.formSection}>
        <TextInput
          mode="outlined"
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          dense
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          dense
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          dense
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Phone (10 digits)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          dense
          style={styles.input}
        />
        {hasChanges && (
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Notification Permission */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Notifications</Text>
      <Card elevation={0} style={styles.pushCard}>
        <Card.Content>
          <View style={styles.pushHeader}>
            <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#111827" />
            <View style={styles.pushInfo}>
              <Text variant="bodyLarge" style={styles.pushTitle}>Push Notifications</Text>
              <Text variant="bodySmall" style={styles.pushSubtitle}>
                {permissionStatus === 'granted'
                  ? 'Notifications are enabled'
                  : permissionStatus === 'denied'
                  ? 'Notifications are blocked in device settings'
                  : 'Enable to receive alerts for messages, posts, and events'}
              </Text>
            </View>
          </View>
          {pushLoading ? (
            <ActivityIndicator style={styles.pushLoader} />
          ) : permissionStatus === 'granted' ? (
            <View style={styles.pushStatus}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
              <Text variant="bodySmall" style={styles.pushStatusText}>Enabled</Text>
            </View>
          ) : permissionStatus === 'denied' ? (
            <Button
              mode="outlined"
              icon="cog"
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
              compact
            >
              Open Settings
            </Button>
          ) : (
            <Button
              mode="contained"
              icon="bell"
              onPress={requestPermission}
              style={styles.pushEnableButton}
            >
              Enable Notifications
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Notification Preferences */}
      <Text variant="titleSmall" style={styles.prefsLabel}>Notification Types</Text>
      <Card elevation={0} style={styles.prefsCard}>
        <Card.Content style={styles.prefsContent}>
          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <MaterialCommunityIcons name="chat-outline" size={20} color="#6b7280" />
              <Text variant="bodyMedium">Chat Messages</Text>
            </View>
            <Switch
              value={prefs.chat_messages}
              onValueChange={(v) => updatePref('chat_messages', v)}
              color="#111827"
            />
          </View>
          <Divider />
          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#6b7280" />
              <Text variant="bodyMedium">New Posts</Text>
            </View>
            <Switch
              value={prefs.new_posts}
              onValueChange={(v) => updatePref('new_posts', v)}
              color="#111827"
            />
          </View>
          <Divider />
          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <MaterialCommunityIcons name="comment-text-outline" size={20} color="#6b7280" />
              <Text variant="bodyMedium">Comments on My Posts</Text>
            </View>
            <Switch
              value={prefs.post_comments}
              onValueChange={(v) => updatePref('post_comments', v)}
              color="#111827"
            />
          </View>
          <Divider />
          <View style={styles.prefRow}>
            <View style={styles.prefInfo}>
              <MaterialCommunityIcons name="calendar-comment" size={20} color="#6b7280" />
              <Text variant="bodyMedium">Event Comments</Text>
            </View>
            <Switch
              value={prefs.event_comments}
              onValueChange={(v) => updatePref('event_comments', v)}
              color="#111827"
            />
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Google Calendar */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Integrations</Text>
      <Card elevation={0} style={styles.gcalCard}>
        <Card.Content>
          <View style={styles.gcalHeader}>
            <MaterialCommunityIcons name="google" size={24} color="#4285F4" />
            <View style={styles.gcalInfo}>
              <Text variant="bodyLarge" style={styles.gcalTitle}>Google Calendar</Text>
              <Text variant="bodySmall" style={styles.gcalSubtitle}>Sync events to your personal calendar</Text>
            </View>
          </View>
          {gcalLoading ? (
            <ActivityIndicator style={styles.gcalLoader} />
          ) : gcalConnected ? (
            <View style={styles.gcalConnected}>
              <View style={styles.gcalStatus}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
                <Text variant="bodySmall" style={styles.gcalStatusText}>Connected</Text>
              </View>
              <Button
                mode="outlined"
                textColor="#ef4444"
                onPress={gcalDisconnect}
                compact
              >
                Disconnect
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              icon="calendar-sync"
              onPress={handleGCalConnect}
              style={styles.gcalConnectButton}
            >
              Connect Google Calendar
            </Button>
          )}
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Support */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Support</Text>
      <Card elevation={0} style={styles.supportCard}>
        <Card.Content style={styles.supportContent}>
          <Pressable style={styles.supportRow} onPress={() => Linking.openURL('mailto:ambassadors@linfield.edu')}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" />
            <Text variant="bodyMedium">Contact Support</Text>
          </Pressable>
          <Pressable
            style={styles.supportRow}
            onPress={() => Linking.openURL(
              'mailto:skyler.a.stevens@gmail.com' +
              '?subject=Bug%20Report%20%2F%20App%20Idea%20-%20Ambassador%20Portal' +
              '&body=Type%3A%20%5BBug%20%2F%20Feature%20Request%5D%0A%0ADescription%3A%0A%0A%0ASteps%20to%20Reproduce%20(if%20bug)%3A%0A1.%0A2.%0A3.'
            )}
          >
            <MaterialCommunityIcons name="bug-outline" size={20} color="#6b7280" />
            <Text variant="bodyMedium">Report Bug / App Idea</Text>
          </Pressable>
          <Pressable
            style={styles.supportRow}
            onPress={() => {
              const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://ambo-portal.vercel.app';
              Linking.openURL(`${webUrl}/privacy`);
            }}
          >
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#6b7280" />
            <Text variant="bodyMedium">Privacy Policy</Text>
          </Pressable>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Sign Out */}
      <Button
        mode="contained"
        buttonColor="#ef4444"
        icon="logout"
        onPress={signOut}
        style={styles.signOutButton}
      >
        Sign Out
      </Button>

      {/* Delete Account */}
      <Button
        mode="text"
        textColor="#ef4444"
        icon="delete-outline"
        onPress={handleDeleteAccount}
        loading={deleting}
        disabled={deleting}
        style={styles.deleteButton}
      >
        Delete Account
      </Button>

      <Text variant="bodySmall" style={styles.versionText}>
        Ambassador Portal v{Constants.expoConfig?.version || '1.0.0'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  divider: { marginVertical: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  formSection: { gap: 12 },
  input: { backgroundColor: '#fff' },
  saveButton: { borderRadius: 12, marginTop: 4 },
  pushCard: { backgroundColor: '#f9fafb', marginBottom: 12 },
  pushHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pushInfo: { flex: 1 },
  pushTitle: { fontWeight: '600' },
  pushSubtitle: { color: '#6b7280' },
  pushLoader: { marginVertical: 8 },
  pushStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pushStatusText: { color: '#16a34a', fontWeight: '600' },
  pushEnableButton: { borderRadius: 8 },
  prefsLabel: { fontWeight: '600', marginBottom: 8, color: '#6b7280' },
  prefsCard: { backgroundColor: '#f9fafb' },
  prefsContent: { gap: 4 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  prefInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gcalCard: { backgroundColor: '#f9fafb' },
  gcalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  gcalInfo: { flex: 1 },
  gcalTitle: { fontWeight: '600' },
  gcalSubtitle: { color: '#6b7280' },
  gcalLoader: { marginVertical: 8 },
  gcalConnected: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gcalStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gcalStatusText: { color: '#16a34a', fontWeight: '600' },
  gcalConnectButton: { borderRadius: 8 },
  supportCard: { backgroundColor: '#f9fafb' },
  supportContent: { gap: 0 },
  supportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  signOutButton: { borderRadius: 12 },
  deleteButton: { marginTop: 12 },
  versionText: { color: '#d1d5db', textAlign: 'center', marginTop: 16 },
});
