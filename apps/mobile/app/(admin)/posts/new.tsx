import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TextInput as RNTextInput,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
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
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<RNTextInput>(null);

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    setSelection(e.nativeEvent.selection);
  };

  const wrapSelection = (wrapper: string) => {
    const { start, end } = selection;
    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);

    if (start === end) {
      // No selection: insert placeholder
      const placeholder = wrapper === '**' ? '**bold**' : '*italic*';
      const newContent = before + placeholder + after;
      setContent(newContent);
    } else {
      // Wrap selected text
      const newContent = before + wrapper + selected + wrapper + after;
      setContent(newContent);
    }
  };

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
        ref={inputRef as any}
        mode="outlined"
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        onSelectionChange={handleSelectionChange}
        multiline
        style={styles.input}
        autoFocus
      />

      <View style={styles.toolbar}>
        <IconButton
          icon="format-bold"
          size={20}
          onPress={() => wrapSelection('**')}
          style={styles.toolbarButton}
        />
        <IconButton
          icon="format-italic"
          size={20}
          onPress={() => wrapSelection('*')}
          style={styles.toolbarButton}
        />
      </View>

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
  toolbar: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  toolbarButton: {
    margin: 0,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  postButton: {
    marginTop: 16,
    borderRadius: 12,
  },
});
