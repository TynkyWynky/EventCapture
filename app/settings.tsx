import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { AppButton } from '@/components/ui/app-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useUser();
  const { showToast } = useToast();
  const [push, setPush] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [likes, setLikes] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            signOut();
            showToast({
              tone: 'info',
              title: 'Account deleted',
              message: 'Your account has been removed. This is a demo action.',
            });
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

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
        <ScreenHeader eyebrow="PREFERENCES" title="Settings" onBack={() => router.back()} />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Make the app feel like yours</Text>
          <Text style={styles.heroText}>Control notifications, account options and support settings from one clean place.</Text>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.langRow}>
            {['EN', 'NL', 'FR'].map((code) => (
              <View key={code} style={[styles.lang, code === 'NL' && styles.langActive]}>
                <Text style={[styles.langText, code === 'NL' && styles.langTextActive]}>{code}</Text>
              </View>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {settingRow('Push notifications', 'Receive general updates and activity alerts', push, setPush)}
          {settingRow('Event reminders', 'Get reminded before saved events start', reminder, setReminder)}
          {settingRow('Likes & comments', 'Stay informed when people interact with your posts', likes, setLikes)}
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Account & support</Text>
          {linkRow('Change password', 'Update your sign-in credentials', '/auth/change-password')}
          {linkRow('Help & FAQ', 'Find answers to common questions', '/faq')}
          {linkRow('Contact us', 'Reach out for support or feedback', '/contact')}
        </SurfaceCard>

        <View style={styles.actionBlock}>
          <AppButton
            label="Sign out"
            variant="secondary"
            onPress={() => {
              signOut();
              router.replace('/auth/login');
            }}
          />
          <AppButton label="Delete account" variant="danger" onPress={handleDeleteAccount} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  heroCard: {
    backgroundColor: '#231b17',
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
});
