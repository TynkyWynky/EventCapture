import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: 'md' | 'lg';
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  size = 'md',
}: AppButtonProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 7,
      tension: 180,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={[
          styles.base,
          size === 'lg' && styles.large,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'danger' && styles.danger,
          variant === 'ghost' && styles.ghost,
          disabled && styles.disabled,
          style,
        ]}>
        <Text
          style={[
            styles.label,
            variant === 'secondary' && styles.secondaryLabel,
            variant === 'danger' && styles.dangerLabel,
            variant === 'ghost' && styles.ghostLabel,
            textStyle,
          ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    minHeight: 56,
    borderRadius: Radius.xl,
  },
  primary: {
    backgroundColor: Colors.light.tint,
    ...Shadows.card,
  },
  secondary: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.borderStrong,
  },
  danger: {
    backgroundColor: '#fff3f1',
    borderWidth: 1,
    borderColor: '#f4c9c0',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    ...Typography.button,
    color: '#fffdfa',
  },
  secondaryLabel: {
    color: Colors.light.title,
  },
  dangerLabel: {
    color: '#b94736',
  },
  ghostLabel: {
    color: Colors.light.tint,
  },
});
