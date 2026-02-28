import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { RoleBadge } from '@/components/RoleBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AvatarUpload } from '@/components/AvatarUpload';

export default function StudentProfile() {
  const { session, signOut } = useAuth();
  const userId = session?.user?.id || '';
  const { user, loading, refetch } = useProfile(userId);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  if (loading) return <LoadingScreen />;

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`
    : '?';

  const displayAvatar = avatarUrl || user?.avatar_url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content style={styles.infoContent}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" />
            <View>
              <Text variant="labelSmall" style={styles.infoLabel}>Email</Text>
              <Text variant="bodyMedium">{user?.email || 'Not set'}</Text>
            </View>
          </View>
          <Divider />
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color="#6b7280" />
            <View>
              <Text variant="labelSmall" style={styles.infoLabel}>Phone</Text>
              <Text variant="bodyMedium">{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Account Actions */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Account Actions</Text>
      <Button
        mode="contained"
        buttonColor="#ef4444"
        icon="logout"
        onPress={signOut}
        style={styles.signOutButton}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: { backgroundColor: '#e5e7eb' },
  name: { fontWeight: '700' },
  divider: { marginVertical: 16 },
  infoCard: { backgroundColor: '#f9fafb' },
  infoContent: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  infoLabel: { color: '#9ca3af', marginBottom: 2 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  signOutButton: { borderRadius: 12 },
});
