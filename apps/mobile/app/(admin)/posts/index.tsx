import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/PostCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';

export default function AdminPostsFeed() {
  const router = useRouter();
  const { posts, loading, refetch } = usePosts();

  if (loading && posts.length === 0) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            id={item.id}
            content={item.content}
            createdAt={item.created_at}
            author={item.users}
            commentCount={item.comments?.[0]?.count || 0}
            onPress={() => router.push(`/(admin)/posts/${item.id}`)}
          />
        )}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="message-text-outline"
            title="No posts yet"
            subtitle="Be the first to post something!"
          />
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      />
      <FAB
        icon="plus"
        color="#fff"
        style={styles.fab}
        onPress={() => router.push('/(admin)/posts/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16 },
  emptyContainer: { flex: 1, padding: 16 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
  },
});
