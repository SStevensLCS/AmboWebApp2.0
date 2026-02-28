import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '@/providers/AuthProvider';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/PostCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';

export default function StudentPosts() {
  const { session, userRole } = useAuth();
  const userId = session?.user?.id || '';
  const { posts, loading, refetch, createPost, editPost, deletePost } = usePosts();
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!newPostText.trim()) return;
    setPosting(true);
    try {
      await createPost(userId, newPostText.trim());
      setNewPostText('');
    } catch {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
          } catch {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  if (loading && posts.length === 0) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Create post */}
      <View style={styles.createCard}>
        <TextInput
          mode="outlined"
          placeholder="What's on your mind?"
          value={newPostText}
          onChangeText={setNewPostText}
          multiline
          dense
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handlePost}
          loading={posting}
          disabled={!newPostText.trim() || posting}
          style={styles.postButton}
        >
          Post
        </Button>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            id={item.id}
            userId={item.user_id}
            content={item.content}
            createdAt={item.created_at}
            author={item.users}
            commentCount={item.comments?.[0]?.count || 0}
            currentUserId={userId}
            currentUserRole={userRole || 'student'}
            onEdit={editPost}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={<EmptyState icon="message-text-outline" title="No posts yet" subtitle="Be the first to post something!" />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  createCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  input: { backgroundColor: '#fff' },
  postButton: { alignSelf: 'flex-end', borderRadius: 8 },
  list: { padding: 16 },
  emptyContainer: { flex: 1, padding: 16 },
});
