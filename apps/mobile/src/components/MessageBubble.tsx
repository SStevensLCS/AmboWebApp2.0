import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Text } from 'react-native-paper';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  senderName: string;
  senderAvatar?: string;
  isOwn: boolean;
}

export function MessageBubble({ content, createdAt, senderName, senderAvatar, isOwn }: MessageBubbleProps) {
  const time = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && (
        <View style={styles.avatarCol}>
          {senderAvatar ? (
            <Avatar.Image size={28} source={{ uri: senderAvatar }} />
          ) : (
            <Avatar.Text size={28} label={initials} style={styles.avatarFallback} labelStyle={{ fontSize: 11 }} />
          )}
        </View>
      )}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {!isOwn && (
          <Text variant="labelSmall" style={styles.senderName}>{senderName}</Text>
        )}
        <Text variant="bodyMedium" style={isOwn ? styles.ownText : styles.otherText}>
          {content}
        </Text>
        <Text variant="bodySmall" style={[styles.time, isOwn ? styles.ownTimeText : styles.otherTimeText]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatarCol: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarFallback: { backgroundColor: '#e5e7eb' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#1f2937',
  },
  time: {
    marginTop: 4,
    fontSize: 10,
  },
  ownTimeText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherTimeText: {
    color: '#9ca3af',
  },
});
