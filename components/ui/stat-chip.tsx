import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatChipProps {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'light' | 'dark' | 'accent';
}

export function StatChip({
  label,
  value,
  icon,
  tone = 'light',
}: StatChipProps) {
  return (
    <View
      style={[
        styles.base,
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
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
    backgroundColor: '#fff1e0',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    color: '#1f1a17',
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
  },
  darkValue: {
    color: '#fff7ef',
  },
  accentValue: {
    color: Colors.light.tint,
  },
  label: {
    color: '#81776f',
    fontSize: 12,
    fontWeight: '600',
  },
  darkLabel: {
    color: '#e7d2c4',
  },
  accentLabel: {
    color: '#8d6c56',
  },
});
