import React, { useState, useEffect } from 'react';
import { View, ScrollView, FlatList, StyleSheet, Alert, Pressable } from 'react-native';
import { Text, TextInput, Button, Avatar, IconButton, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
}

interface UserItem {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
}

export default function AdminChatEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id || '';

  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add people state
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch group info and participants
  useEffect(() => {
    if (!id) return;
    async function fetchGroupData() {
      setLoading(true);

      // Fetch group name
      const { data: group } = await supabase
        .from('chat_groups')
        .select('name')
        .eq('id', id)
        .single();

      if (group?.name) {
        setGroupName(group.name);
      }

      // Fetch participants with user details
      const { data: parts } = await supabase
        .from('chat_participants')
        .select('user_id, users(id, first_name, last_name, avatar_url, role)')
        .eq('group_id', id);

      if (parts) {
        const mapped = parts
          .filter((p: any) => p.users)
          .map((p: any) => ({
            id: p.users.id,
            first_name: p.users.first_name,
            last_name: p.users.last_name,
            avatar_url: p.users.avatar_url,
            role: p.users.role,
          }));
        setParticipants(mapped);
      }

      setLoading(false);
    }
    fetchGroupData();
  }, [id]);

  // Search users when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const q = searchQuery.trim().toLowerCase();
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url, role')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(20);

      if (data) {
        // Filter out users already in the group
        const participantIds = participants.map((p) => p.id);
        const filtered = data.filter((u: any) => !participantIds.includes(u.id));
        setSearchResults(filtered as UserItem[]);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, participants]);

  const handleAddUser = async (user: UserItem) => {
    if (!id) return;

    const { error } = await supabase
      .from('chat_participants')
      .insert({ group_id: id, user_id: user.id });

    if (error) {
      Alert.alert('Error', 'Failed to add participant');
      return;
    }

    setParticipants((prev) => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);

    const { error } = await supabase
      .from('chat_groups')
      .update({ name: groupName.trim() || null })
      .eq('id', id);

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to update group name');
      return;
    }

    router.back();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Group Name Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Group Name</Text>
      <TextInput
        mode="outlined"
        value={groupName}
        onChangeText={setGroupName}
        placeholder="Enter group name"
        dense
        style={styles.nameInput}
      />

      <Divider style={styles.divider} />

      {/* Participants Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Participants ({participants.length})
      </Text>
      {participants.map((p) => {
        const initials = getInitials(p.first_name, p.last_name);
        return (
          <View key={p.id} style={styles.participantRow}>
            {p.avatar_url ? (
              <Avatar.Image size={40} source={{ uri: p.avatar_url }} />
            ) : (
              <Avatar.Text size={40} label={initials} style={styles.avatarFallback} />
            )}
            <View style={styles.participantInfo}>
              <Text variant="bodyMedium" style={styles.participantName}>
                {p.first_name} {p.last_name}
              </Text>
              <Text variant="bodySmall" style={styles.participantRole}>
                {p.role}
              </Text>
            </View>
          </View>
        );
      })}

      <Divider style={styles.divider} />

      {/* Add People Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Add People</Text>
      {!showAddPeople ? (
        <Button
          mode="outlined"
          icon="account-plus"
          onPress={() => setShowAddPeople(true)}
          style={styles.addButton}
        >
          Add People
        </Button>
      ) : (
        <View>
          <TextInput
            mode="outlined"
            label="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            dense
            left={<TextInput.Icon icon="magnify" />}
            style={styles.searchInput}
            autoFocus
          />
          {searchResults.map((user) => {
            const initials = getInitials(user.first_name, user.last_name);
            return (
              <Pressable
                key={user.id}
                style={styles.searchResultRow}
                onPress={() => handleAddUser(user)}
              >
                {user.avatar_url ? (
                  <Avatar.Image size={36} source={{ uri: user.avatar_url }} />
                ) : (
                  <Avatar.Text size={36} label={initials} style={styles.avatarFallback} />
                )}
                <View style={styles.participantInfo}>
                  <Text variant="bodyMedium" style={styles.participantName}>
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text variant="bodySmall" style={styles.participantRole}>
                    {user.role}
                  </Text>
                </View>
                <IconButton icon="plus" size={20} />
              </Pressable>
            );
          })}
          {searching && (
            <Text variant="bodySmall" style={styles.searchingText}>Searching...</Text>
          )}
          {searchQuery.trim() && !searching && searchResults.length === 0 && (
            <Text variant="bodySmall" style={styles.searchingText}>No users found</Text>
          )}
        </View>
      )}

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Save
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  nameInput: { backgroundColor: '#fff', marginBottom: 8 },
  divider: { marginVertical: 16 },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  avatarFallback: { backgroundColor: '#e5e7eb' },
  participantInfo: { flex: 1 },
  participantName: { fontWeight: '600' },
  participantRole: { color: '#6b7280' },
  addButton: { marginBottom: 8, borderRadius: 8 },
  searchInput: { backgroundColor: '#fff', marginBottom: 8 },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 12,
  },
  searchingText: { color: '#6b7280', paddingVertical: 8, textAlign: 'center' },
  footer: { marginTop: 24 },
  saveButton: { borderRadius: 8 },
});
