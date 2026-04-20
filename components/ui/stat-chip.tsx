import { Colors, Radius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatChipProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'light' | 'dark' | 'accent';
  compact?: boolean;
}

export function StatChip({
  label,
  value,
  icon,
  tone = 'light',
  compact = false,
}: StatChipProps) {
  return (
    <View
      style={[
        styles.base,
        compact && styles.compact,
        tone === 'light' && styles.light,
        tone === 'dark' && styles.dark,
        tone === 'accent' && styles.accent,
      ]}>
      <View style={styles.valueRow}>
        {icon ? (
          <Ionicons
            name={icon}
            size={14}
            color={tone === 'dark' ? '#f6d6bb' : Colors.light.tint}
          />
        ) : null}
        <Text
          style={[
            styles.value,
            tone === 'dark' && styles.darkValue,
            tone === 'accent' && styles.accentValue,
          ]}>
          {value}
        </Text>
      </View>
      <Text
        style={[
          styles.label,
          tone === 'dark' && styles.darkLabel,
          tone === 'accent' && styles.accentLabel,
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 92,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 4,
  },
  compact: {
    minWidth: 84,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  light: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  accent: {
    backgroundColor: '#fff3e6',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
    flexShrink: 1,
  },
  darkValue: {
    color: '#fff7ef',
  },
  accentValue: {
    color: Colors.light.tint,
  },
  label: {
    ...Typography.caption,
    color: Colors.light.subtitle,
  },
  darkLabel: {
    color: '#e7d2c4',
  },
  accentLabel: {
    color: '#8d6c56',
  },
});
