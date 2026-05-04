import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  leading?: React.ReactNode;
  mode?: 'hero' | 'compact';
  surface?: boolean;
  tone?: 'default' | 'inverse';
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  rightAction,
  leading,
  mode = 'hero',
  surface = true,
  tone = 'default',
}: ScreenHeaderProps) {
  const inverse = tone === 'inverse';
  const leftNode = onBack ? (
    <TouchableOpacity
      style={[
        styles.iconButton,
        !surface && styles.iconButtonFlat,
        inverse && styles.iconButtonInverse,
      ]}
      onPress={onBack}>
      <Ionicons name="chevron-back" size={20} color={inverse ? '#fff7ef' : '#1f1a17'} />
    </TouchableOpacity>
  ) : leading ? (
    <View style={styles.leadingWrap}>{leading}</View>
  ) : null;

  return (
    <View
      style={[
        surface && styles.shell,
        surface && mode === 'compact' && styles.shellCompact,
      ]}>
      <View style={[styles.header, mode === 'compact' && styles.headerCompact]}>
        {leftNode ? <View style={styles.leftSlot}>{leftNode}</View> : null}

        <View style={styles.copy}>
          <Text style={[styles.eyebrow, inverse && styles.eyebrowInverse]}>{eyebrow}</Text>
          <Text
            style={[
              styles.title,
              mode === 'compact' && styles.titleCompact,
              inverse && styles.titleInverse,
            ]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, inverse && styles.subtitleInverse]}>{subtitle}</Text>
          ) : null}
        </View>

        {rightAction ? <View style={styles.rightSlot}>{rightAction}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  shellCompact: {
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  headerCompact: {
    alignItems: 'center',
  },
  leftSlot: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
  },
  rightSlot: {
    marginLeft: Spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.round,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonFlat: {
    backgroundColor: Colors.light.card,
    ...Shadows.soft,
  },
  iconButtonInverse: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  leadingWrap: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  eyebrow: {
    ...Typography.eyebrow,
    color: Colors.light.subtitle,
  },
  eyebrowInverse: {
    color: '#e7c7aa',
  },
  title: {
    ...Typography.titleLg,
    color: Colors.light.title,
    marginTop: 3,
  },
  titleCompact: {
    ...Typography.titleSm,
    marginTop: 2,
  },
  titleInverse: {
    color: '#fff7ef',
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
    marginTop: 6,
  },
  subtitleInverse: {
    color: '#e9dacd',
  },
});
