import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { usePosts } from '@/hooks/usePosts';

export default function NewPost() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id || '';
  const { createPost } = usePosts();

  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await createPost(userId, content.trim());
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        style={styles.input}
        autoFocus
      />

      <Button
        mode="contained"
        onPress={handlePost}
        loading={posting}
        disabled={!content.trim() || posting}
        style={styles.postButton}
      >
        Post
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  input: {
    backgroundColor: '#fff',
    minHeight: 150,
  },
  postButton: {
    marginTop: 16,
    borderRadius: 12,
  },
});
