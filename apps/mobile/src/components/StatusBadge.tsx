import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SubmissionStatus } from '@ambo/database';
import { statusColors } from '@/lib/theme';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
