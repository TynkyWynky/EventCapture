import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [push, setPush] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [likes, setLikes] = useState(true);

  const settingRow = (label: string, subtitle: string, value: boolean, setter: (v: boolean) => void) => (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={setter}
        thumbColor="#ffffff"
        trackColor={{ false: '#d8cec3', true: Colors.light.tint }}
      />
    </View>
  );

  const linkRow = (label: string, subtitle: string, route?: string) => (
    <TouchableOpacity style={styles.linkRow} onPress={() => route && router.push(route as any)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#81776f" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>PREFERENCES</Text>
            <Text style={styles.title}>Settings</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Make the app feel like yours</Text>
          <Text style={styles.heroText}>Control notifications, account options and support settings from one clean place.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.langRow}>
            {['EN', 'NL', 'FR'].map((code) => (
              <View key={code} style={[styles.lang, code === 'NL' && styles.langActive]}>
                <Text style={[styles.langText, code === 'NL' && styles.langTextActive]}>{code}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {settingRow('Push notifications', 'Receive general updates and activity alerts', push, setPush)}
          {settingRow('Event reminders', 'Get reminded before saved events start', reminder, setReminder)}
          {settingRow('Likes & comments', 'Stay informed when people interact with your posts', likes, setLikes)}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account & support</Text>
          {linkRow('Change password', 'Update your sign-in credentials')}
          {linkRow('Help & FAQ', 'Find answers to common questions', '/faq')}
          {linkRow('Contact us', 'Reach out for support or feedback', '/contact')}
        </View>

        <View style={styles.actionBlock}>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineText}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn}>
            <Text style={styles.dangerText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  heroCard: {
    backgroundColor: '#231b17',
    borderRadius: 24,
    padding: 18,
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    lineHeight: 21,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lang: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#f3e7da',
  },
  langActive: {
    backgroundColor: '#231b17',
  },
  langText: {
    color: '#1f1a17',
    fontWeight: '800',
  },
  langTextActive: {
    color: '#fff7ef',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingLabel: { fontWeight: '700', color: '#1f1a17' },
  settingHint: { color: '#81776f', fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  actionBlock: {
    gap: 10,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  outlineText: { color: Colors.light.tint, fontWeight: '800' },
  dangerBtn: {
    backgroundColor: Colors.light.danger,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: { color: '#fff', fontWeight: '800' },
});
