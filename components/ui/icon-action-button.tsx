import { Colors, Radius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface IconActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: 'light' | 'dark' | 'subtle' | 'accent';
}

export function IconActionButton({
  icon,
  onPress,
  tone = 'light',
}: IconActionButtonProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[
          styles.base,
          tone === 'light' && styles.light,
          tone === 'dark' && styles.dark,
          tone === 'subtle' && styles.subtle,
          tone === 'accent' && styles.accent,
        ]}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.94,
            useNativeDriver: true,
            friction: 7,
            tension: 180,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 180,
          }).start()
        }>
        <Ionicons
          name={icon}
          size={20}
          color={
            tone === 'dark'
              ? '#fff7ef'
              : tone === 'accent'
                ? '#fffdfa'
                : Colors.light.title
          }
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 42,
    height: 42,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.soft,
  },
  dark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  subtle: {
    backgroundColor: Colors.light.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  accent: {
    backgroundColor: Colors.light.tint,
    ...Shadows.card,
  },
});
