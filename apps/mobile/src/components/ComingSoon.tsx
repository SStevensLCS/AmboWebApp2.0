import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';

interface ComingSoonProps {
  feature?: string;
}

export function ComingSoon({ feature = 'This feature' }: ComingSoonProps) {
  return (
    <View style={styles.container}>
      <Icon source="clock-outline" size={48} color="#9ca3af" />
      <Text style={styles.title}>Coming Soon</Text>
      <Text style={styles.subtitle}>{feature} is under development.</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
