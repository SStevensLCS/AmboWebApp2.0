import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Text, Card, Avatar, Divider, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { RoleBadge } from '@/components/RoleBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { User, UserRole } from '@ambo/database';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' },
];

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userRole: currentUserRole } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<string>('student');

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, role, avatar_url')
        .eq('id', id)
        .single();
      if (data) {
        const u = data as User;
        setUser(u);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setRole(u.role || 'student');
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  const handleSave = async () => {
    if (!user) return;

    // Protect superadmin promotion
    if (role === 'superadmin' && currentUserRole !== 'superadmin') {
      Alert.alert('Permission Denied', 'Only superadmins can promote users to superadmin.');
      return;
    }

    // Validate phone format
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
        role: role as UserRole,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'User updated successfully.');
      setUser({ ...user, first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), phone: phone.trim() || null, role: role as UserRole });
    }
  };

  if (loading || !user) return <LoadingScreen />;

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <>
      <Stack.Screen options={{ title: `${user.first_name} ${user.last_name}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          {user.avatar_url ? (
            <Avatar.Image size={80} source={{ uri: user.avatar_url }} />
          ) : (
            <Avatar.Text size={80} label={initials} style={styles.avatar} />
          )}
          <RoleBadge role={role as UserRole} />
        </View>

        <Divider style={styles.divider} />

        {/* Editable Fields */}
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

          <Text variant="labelLarge" style={styles.roleLabel}>Role</Text>
          <SegmentedButtons
            value={role}
            onValueChange={setRole}
            buttons={
              currentUserRole === 'superadmin'
                ? ROLE_OPTIONS
                : ROLE_OPTIONS.filter((r) => r.value !== 'superadmin')
            }
            style={styles.roleButtons}
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: { backgroundColor: '#e5e7eb' },
  divider: { marginVertical: 16 },
  formSection: { gap: 12 },
  input: { backgroundColor: '#fff' },
  roleLabel: { fontWeight: '600', marginTop: 4 },
  roleButtons: { marginBottom: 4 },
  saveButton: { marginTop: 8, borderRadius: 12 },
});
