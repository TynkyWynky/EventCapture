import { Colors } from '@/constants/theme';
import React from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
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
