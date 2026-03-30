import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface IconActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: 'light' | 'dark';
}

export function IconActionButton({
  icon,
  onPress,
  tone = 'light',
}: IconActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, tone === 'light' ? styles.light : styles.dark]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Ionicons
        name={icon}
        size={20}
        color={tone === 'light' ? '#1f1a17' : '#fff7ef'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
