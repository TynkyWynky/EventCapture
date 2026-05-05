import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Colors, Layout, Radius, Spacing, Typography } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAllRead } = useSocial();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const items = notifications.map((item, index) => ({
    ...item,
    section: index < 3 ? t('notifSectionNew') : t('notifSectionEarlier'),
  }));
  const sections = [t('notifSectionNew'), t('notifSectionEarlier')];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('notifEyebrow')}
          title={t('notifTitle')}
          onBack={() => router.back()}
          mode="compact"
          rightAction={
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              void markAllRead()
                .then(() => {
                  showToast({ tone: 'success', title: t('notifToastTitle'), message: t('notifToastMsg') });
                })
                .catch((error) => {
                  showToast({
                    tone: 'error',
                    title: t('notifTitle'),
                    message: error instanceof Error ? error.message : 'Unable to mark notifications as read.',
                  });
                });
            }}>
              <Ionicons name="checkmark-done-outline" size={20} color="#1f1a17" />
            </TouchableOpacity>
          }
        />

        <SurfaceCard style={styles.heroCard} variant="feature">
          <Text style={styles.heroTitle}>{t('notifHeroTitle')}</Text>
          <Text style={styles.heroText}>{t('notifHeroText')}</Text>
        </SurfaceCard>

        {!items.length ? (
          <EmptyState
            icon="notifications-outline"
            title={t('notifEmptyTitle')}
            message={t('notifEmptyMsg')}
          />
        ) : null}

        {sections.map((section) => {
          const entries = items.filter((item) => item.section === section);
          if (!entries.length) return null;

          return (
            <View key={section} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section}</Text>

              {entries.map((item, idx) => (
                <TouchableOpacity key={`${section}-${idx}`} activeOpacity={0.92} style={styles.card}>
                  <View style={[styles.avatar, { backgroundColor: item.color }]}>
                    <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
                  </View>

                  <View style={styles.copy}>
                    <Text style={styles.text}>
                      <Text style={styles.user}>{item.user}</Text>
                      <Text> {item.text}</Text>
                    </Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <View style={[styles.iconBadge, { backgroundColor: `${item.color}18` }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad },
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
  heroCard: {
    marginBottom: 20,
    gap: 6,
  },
  heroTitle: {
    ...Typography.titleSm,
    color: Colors.light.title,
    marginBottom: 20,
  },
  heroText: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    ...Typography.eyebrow,
    color: Colors.light.subtitle,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  copy: {
    flex: 1,
  },
  text: { ...Typography.bodySm, color: '#3a322d' },
  user: {
    fontWeight: '800',
    color: '#1f1a17',
  },
  time: { ...Typography.caption, color: '#8c827a', marginTop: 4 },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
