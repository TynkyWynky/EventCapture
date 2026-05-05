import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/constants/translations';
import { AppButton } from '@/components/ui/app-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Layout, Radius, Typography } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut, deleteAccount } = useUser();
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [push, setPush] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [likes, setLikes] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccAlertTitle'),
      t('deleteAccAlertMsg'),
      [
        { text: t('cancelBtn'), style: 'cancel' },
        {
          text: t('deleteBtn'),
          style: 'destructive',
          onPress: () => {
            void deleteAccount().then((result) => {
              if (!result.ok) {
                showToast({
                  tone: 'error',
                  title: t('deleteAccAlertTitle'),
                  message: result.error ?? 'Unable to delete your account right now.',
                });
                return;
              }

              showToast({
                tone: 'info',
                title: t('accDeletedTitle'),
                message: 'Your account has been removed.',
              });
              router.replace('/auth/login');
            });
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
        <ScreenHeader eyebrow={t('settingsEyebrow')} title={t('settingsTitle')} onBack={() => router.back()} mode="compact" />

        <SurfaceCard style={styles.heroCard} variant="feature">
          <Text style={styles.heroTitle}>{t('settingsHeroTitle')}</Text>
          <Text style={styles.heroText}>{t('settingsHeroText')}</Text>
        </SurfaceCard>

        <SurfaceCard variant="subtle">
          <Text style={styles.sectionTitle}>{t('langSection')}</Text>
          <View style={styles.langRow}>
            {(['EN', 'NL', 'FR'] as Language[]).map((code) => (
              <TouchableOpacity 
                key={code} 
                activeOpacity={0.8}
                onPress={() => setLanguage(code)}
                style={[styles.lang, language === code && styles.langActive]}>
                <Text style={[styles.langText, language === code && styles.langTextActive]}>{code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>{t('notifSection')}</Text>
          {settingRow(t('pushLabel'), t('pushHint'), push, setPush)}
          {settingRow(t('reminderLabel'), t('reminderHint'), reminder, setReminder)}
          {settingRow(t('likesLabel'), t('likesHint'), likes, setLikes)}
        </SurfaceCard>

        <SurfaceCard variant="subtle">
          <Text style={styles.sectionTitle}>{t('accountSection')}</Text>
          {linkRow(t('changePassLabel'), t('changePassHint'), '/auth/change-password')}
          {linkRow(t('faqLabel'), t('faqHint'), '/faq')}
          {linkRow(t('contactLabel'), t('contactHint'), '/contact')}
        </SurfaceCard>

        <View style={styles.actionBlock}>
          <AppButton
            label={t('settingsSignOutBtn')}
            variant="secondary"
            onPress={() => {
              void signOut().then(() => {
                router.replace('/auth/login');
              });
            }}
          />
          <AppButton label={t('deleteAccBtn')} variant="danger" onPress={handleDeleteAccount} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: Layout.sectionGap },
  heroCard: { gap: 8 },
  heroTitle: {
    ...Typography.titleSm,
    color: Colors.light.title,
  },
  heroText: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
    marginTop: 8,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lang: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.cardFeature,
  },
  langActive: {
    backgroundColor: Colors.light.panel,
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
  settingHint: { ...Typography.caption, color: '#81776f', marginTop: 4 },
  actionBlock: {
    gap: 10,
  },
});
