import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<RNTextInput>(null);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const message = text.trim();
    setSending(true);
    setText('');
    try {
      await onSend(message);
    } finally {
      setSending(false);
      // Keep keyboard open after sending
      inputRef.current?.focus();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(8, insets.bottom) }]}>
      <TextInput
        ref={inputRef as any}
        mode="outlined"
        placeholder="Type a message..."
        value={text}
        onChangeText={setText}
        style={styles.input}
        dense
        multiline
        blurOnSubmit={false}
        disabled={disabled}
      />
      <IconButton
        icon="send"
        mode="contained"
        size={20}
        onPress={handleSend}
        disabled={!text.trim() || sending || disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    maxHeight: 100,
  },
});
