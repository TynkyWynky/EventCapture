import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1f1a17" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconSpacer} />
      )}

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {rightAction ? rightAction : <View style={styles.iconSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 40,
    height: 40,
  },
  eyebrow: {
    color: '#857a72',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: '#1f1a17',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#81776f',
    marginTop: 2,
  },
});
