import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Icon source="alert-circle-outline" size={64} color="#ef4444" />
            <Text variant="headlineSmall" style={styles.title}>
              Something went wrong
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              The app encountered an unexpected error. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text variant="labelSmall" style={styles.errorText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <Button
              mode="contained"
              icon="refresh"
              onPress={this.handleReset}
              style={styles.button}
            >
              Try Again
            </Button>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  message: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDetails: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  errorText: {
    color: '#991b1b',
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
});
