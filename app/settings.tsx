import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [push, setPush] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [likes, setLikes] = useState(true);

  const settingRow = (label: string, value: boolean, setter: (v: boolean) => void) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={setter} thumbColor={value ? '#fff' : undefined} />
    </View>
  );

  const linkRow = (label: string, route?: string) => (
    <TouchableOpacity style={styles.linkRow} onPress={() => route && router.push(route)}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.profileCircle} />
          <Text style={styles.title}>Settings</Text>
          <View style={styles.langRow}>
            {['EN', 'NL', 'FR'].map(code => (
              <View key={code} style={[styles.lang, code === 'NL' && { backgroundColor: '#ffd60a' }]}>
                <Text style={{ fontWeight: '800', color: '#111' }}>{code}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          {settingRow('Push Notification', push, setPush)}
          {settingRow('Event Reminder', reminder, setReminder)}
          {settingRow('Likes & Comments', likes, setLikes)}
          {linkRow('Change Password')}
          {linkRow('Help & FAQ', '/faq')}
          {linkRow('Connect Us', '/contact')}
        </View>

        <TouchableOpacity style={styles.outlineBtn}>
          <Text style={styles.outlineText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerBtn}>
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, paddingBottom: 120 },
  header: { alignItems: 'center', gap: 8, marginBottom: 12 },
  profileCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#d9d9d9' },
  title: { fontSize: 22, fontWeight: '800', color: '#111' },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  lang: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabel: { fontWeight: '700', color: '#222' },
  outlineBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#f68c1f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineText: { color: '#f68c1f', fontWeight: '800' },
  dangerBtn: {
    marginTop: 10,
    backgroundColor: '#ff4d4f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerText: { color: '#fff', fontWeight: '800' },
});
