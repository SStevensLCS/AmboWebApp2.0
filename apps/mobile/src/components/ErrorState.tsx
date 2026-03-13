import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Icon source="alert-circle-outline" size={48} color="#ef4444" />
      <Text variant="titleMedium" style={styles.title}>Something went wrong</Text>
      {message && (
        <Text variant="bodyMedium" style={styles.message}>{message}</Text>
      )}
      {onRetry && (
        <Button
          mode="outlined"
          icon="refresh"
          onPress={onRetry}
          style={styles.retryButton}
        >
          Try Again
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  message: {
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 8,
  },
});
