import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FeedbackBannerProps {
  title: string;
  message?: string;
  tone?: 'success' | 'error' | 'info';
}

export function FeedbackBanner({
  title,
  message,
  tone = 'info',
}: FeedbackBannerProps) {
  const icon =
    tone === 'success'
      ? 'checkmark-circle'
      : tone === 'error'
        ? 'alert-circle'
        : 'information-circle';

  return (
    <View
      style={[
        styles.banner,
        tone === 'success' && styles.success,
        tone === 'error' && styles.error,
        tone === 'info' && styles.info,
      ]}>
      <Ionicons
        name={icon}
        size={18}
        color={tone === 'success' ? Colors.light.success : tone === 'error' ? Colors.light.danger : Colors.light.tint}
      />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
  },
  success: {
    backgroundColor: '#ebfaf2',
    borderColor: '#bfe8cf',
  },
  error: {
    backgroundColor: '#fff1ee',
    borderColor: '#f3c4bc',
  },
  info: {
    backgroundColor: '#fff4e6',
    borderColor: '#f2d5b1',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#1f1a17',
    fontWeight: '800',
  },
  message: {
    color: '#6f655e',
    lineHeight: 19,
    fontSize: 12.5,
  },
});
