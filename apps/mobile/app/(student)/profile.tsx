import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { Card, Text, Button, Divider, TextInput, Switch, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { RoleBadge } from '@/components/RoleBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AvatarUpload } from '@/components/AvatarUpload';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

export default function StudentProfile() {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id || '';
  const { user, loading, refetch } = useProfile(userId);
  const { permissionStatus, loading: pushLoading, requestPermission } = usePushNotifications(userId);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

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

  if (loading) return <LoadingScreen />;

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
    : '?';

  const displayAvatar = avatarUrl || user?.avatar_url;
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Avatar & Name */}
      <View style={styles.avatarSection}>
        <AvatarUpload
          userId={userId}
          avatarUrl={displayAvatar}
          initials={initials}
          onUploaded={(url) => { setAvatarUrl(url); refetch(); }}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.first_name} {user?.last_name}
        </Text>
        {user?.role && <RoleBadge role={user.role} />}
      </View>

      <Divider style={styles.divider} />

      {/* Editable Profile Fields */}
      <Text variant="titleSmall" style={styles.sectionLabel}>PROFILE INFORMATION</Text>
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

      {/* Push Notifications */}
      <Text variant="titleSmall" style={styles.sectionLabel}>NOTIFICATIONS</Text>
      <Card style={styles.pushCard}>
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
                  : 'Enable to receive alerts for messages and events'}
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

      <Divider style={styles.divider} />

      {/* Support & About */}
      <Text variant="titleSmall" style={styles.sectionLabel}>SUPPORT</Text>
      <Card style={styles.supportCard}>
        <Card.Content style={styles.supportContent}>
          <View style={styles.supportRow}>
            <MaterialCommunityIcons name="help-circle-outline" size={20} color="#6b7280" />
            <Text variant="bodyMedium">Need help?</Text>
          </View>
          <Button
            mode="text"
            icon="email-outline"
            onPress={() => Linking.openURL('mailto:ambassadors@linfield.edu')}
            compact
            style={styles.supportButton}
          >
            Contact Support
          </Button>
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

      <Text variant="bodySmall" style={styles.versionText}>
        Ambassador Portal v{appVersion}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  name: { fontWeight: '700' },
  divider: { marginVertical: 16 },
  sectionLabel: {
    color: '#9ca3af',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  formSection: { gap: 12 },
  input: { backgroundColor: '#fff' },
  saveButton: { borderRadius: 12, marginTop: 4 },
  pushCard: { backgroundColor: '#fff' },
  pushHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pushInfo: { flex: 1 },
  pushTitle: { fontWeight: '600' },
  pushSubtitle: { color: '#6b7280' },
  pushLoader: { marginVertical: 8 },
  pushStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pushStatusText: { color: '#16a34a', fontWeight: '600' },
  pushEnableButton: { borderRadius: 8 },
  supportCard: { backgroundColor: '#fff' },
  supportContent: { gap: 8 },
  supportRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supportButton: { alignSelf: 'flex-start' },
  signOutButton: { borderRadius: 12 },
  versionText: { color: '#d1d5db', textAlign: 'center', marginTop: 16 },
});
