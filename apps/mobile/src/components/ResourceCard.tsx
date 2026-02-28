import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ResourceCardProps {
  title: string;
  description?: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  showDelete?: boolean;
  onDelete?: () => void;
}

function getFileIcon(fileType?: string): string {
  if (!fileType) return 'file-outline';
  if (fileType.includes('pdf')) return 'file-pdf-box';
  if (fileType.includes('image')) return 'file-image-outline';
  if (fileType.includes('word') || fileType.includes('document')) return 'file-word-outline';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'file-excel-outline';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'file-powerpoint-outline';
  if (fileType.includes('video')) return 'file-video-outline';
  if (fileType.includes('audio')) return 'file-music-outline';
  if (fileType.includes('zip') || fileType.includes('archive')) return 'zip-box-outline';
  return 'file-outline';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResourceCard({
  title,
  description,
  fileUrl,
  fileType,
  fileSize,
  createdAt,
  showDelete,
  onDelete,
}: ResourceCardProps) {
  const iconName = getFileIcon(fileType) as React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  const date = new Date(createdAt).toLocaleDateString();

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName} size={28} color="#3b82f6" />
        </View>
        <View style={styles.info}>
          <Text variant="bodyLarge" style={styles.title} numberOfLines={1}>{title}</Text>
          {description ? (
            <Text variant="bodySmall" style={styles.description} numberOfLines={2}>{description}</Text>
          ) : null}
          <View style={styles.meta}>
            {fileSize ? <Text variant="bodySmall" style={styles.metaText}>{formatFileSize(fileSize)}</Text> : null}
            <Text variant="bodySmall" style={styles.metaText}>{date}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="download"
            size={20}
            onPress={() => Linking.openURL(fileUrl)}
          />
          {showDelete && onDelete && (
            <IconButton
              icon="delete-outline"
              size={20}
              iconColor="#ef4444"
              onPress={onDelete}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontWeight: '600' },
  description: { color: '#6b7280', marginTop: 2 },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { color: '#9ca3af' },
  actions: { flexDirection: 'row' },
});
