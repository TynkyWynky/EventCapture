import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone: 'success' | 'error' | 'info';
}

export function Toast({ item }: { item: ToastItem }) {
  const icon =
    item.tone === 'success'
      ? 'checkmark-circle'
      : item.tone === 'error'
        ? 'alert-circle'
        : 'information-circle';

  return (
    <View
      style={[
        styles.toast,
        item.tone === 'success' && styles.success,
        item.tone === 'error' && styles.error,
        item.tone === 'info' && styles.info,
      ]}>
      <Ionicons
        name={icon}
        size={20}
        color={item.tone === 'success' ? Colors.light.success : item.tone === 'error' ? Colors.light.danger : Colors.light.tint}
      />
      <View style={styles.copy}>
        <Text style={styles.title}>{item.title}</Text>
        {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 14px rgba(0, 0, 0, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }),
  },
  success: {
    backgroundColor: '#f4fff8',
    borderColor: '#bce7ca',
  },
  error: {
    backgroundColor: '#fff6f3',
    borderColor: '#f0cdc4',
  },
  info: {
    backgroundColor: '#fffaf5',
    borderColor: '#f1d7be',
  },
  copy: { flex: 1, gap: 2 },
  title: { color: '#1f1a17', fontWeight: '800' },
  message: { color: '#6f655e', lineHeight: 18, fontSize: 12.5 },
});
