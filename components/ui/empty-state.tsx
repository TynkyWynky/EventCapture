import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={Colors.light.tint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.round,
    backgroundColor: '#fff3e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
    textAlign: 'center',
  },
  message: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
    textAlign: 'center',
    maxWidth: 280,
  },
});
