import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Card, Avatar, Divider } from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';
import { RoleBadge } from '@/components/RoleBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { User } from '@ambo/database';

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, role, avatar_url')
        .eq('id', id)
        .single();
      if (data) setUser(data as User);
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (loading || !user) return <LoadingScreen />;

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <>
      <Stack.Screen options={{ title: `${user.first_name} ${user.last_name}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          {user.avatar_url ? (
            <Avatar.Image size={80} source={{ uri: user.avatar_url }} />
          ) : (
            <Avatar.Text size={80} label={initials} style={styles.avatar} />
          )}
          <Text variant="headlineSmall" style={styles.name}>
            {user.first_name} {user.last_name}
          </Text>
          <RoleBadge role={user.role} />
        </View>

        <Divider style={styles.divider} />

        {/* Info */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" />
              <View>
                <Text variant="labelSmall" style={styles.infoLabel}>Email</Text>
                <Text variant="bodyMedium">{user.email || 'Not set'}</Text>
              </View>
            </View>
            <Divider />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#6b7280" />
              <View>
                <Text variant="labelSmall" style={styles.infoLabel}>Phone</Text>
                <Text variant="bodyMedium">{user.phone || 'Not set'}</Text>
              </View>
            </View>
            <Divider />
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="shield-account-outline" size={20} color="#6b7280" />
              <View>
                <Text variant="labelSmall" style={styles.infoLabel}>Role</Text>
                <Text variant="bodyMedium">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </>
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
});
