import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'feature' | 'subtle' | 'inset';
  padded?: boolean;
}

export function SurfaceCard({
  children,
  style,
  variant = 'default',
  padded = true,
}: SurfaceCardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'feature' && styles.feature,
        variant === 'subtle' && styles.subtle,
        variant === 'inset' && styles.inset,
        !padded && styles.unpadded,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.soft,
  },
  feature: {
    backgroundColor: Colors.light.cardFeature,
    borderColor: Colors.light.borderStrong,
    ...Shadows.card,
  },
  subtle: {
    backgroundColor: Colors.light.cardSubtle,
    ...Shadows.soft,
  },
  inset: {
    backgroundColor: Colors.light.canvas,
    borderColor: Colors.light.border,
    ...(Platform.OS === 'web' ? { boxShadow: 'none' } : { shadowOpacity: 0, elevation: 0 }),
  },
  unpadded: {
    padding: 0,
  },
});
