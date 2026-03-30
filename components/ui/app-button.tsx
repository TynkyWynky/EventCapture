import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.light.tint,
  },
  secondary: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  danger: {
    backgroundColor: Colors.light.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: '#fff',
    fontWeight: '800',
  },
  secondaryLabel: {
    color: '#1f1a17',
  },
});
