import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { Colors, Layout, Typography } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, isOffline, isUsingCachedData, error } = useSocial();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [isClearing, setIsClearing] = React.useState(false);
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
          subtitle={t('notifHeroText')}
          onBack={() => router.back()}
          mode="compact"
          rightAction={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('notifToastTitle')}
              style={[styles.iconButton, (!unreadCount || isClearing) && styles.iconButtonDisabled]}
              disabled={!unreadCount || isClearing}
              onPress={() => {
                setIsClearing(true);
                void markAllRead()
                  .then(() => {
                    showToast({ tone: 'success', title: t('notifToastTitle'), message: t('notifToastMsg') });
                  })
                  .catch((markError) => {
                    showToast({
                      tone: 'error',
                      title: t('notifTitle'),
                      message: markError instanceof Error ? markError.message : t('notifMarkReadError'),
                    });
                  })
                  .finally(() => {
                    setIsClearing(false);
                  });
              }}>
              <Ionicons name="checkmark-done-outline" size={20} color="#1f1a17" />
            </TouchableOpacity>
          }
        />

        {error ? <FeedbackBanner tone="error" title={t('notifTitle')} message={error} /> : null}

        {!error && (isOffline || isUsingCachedData) ? (
          <FeedbackBanner
            tone={isOffline ? 'error' : 'info'}
            title={isOffline ? 'Live activity is unavailable' : 'Showing saved activity'}
            message={isOffline ? t('notifOfflineBanner') : t('notifCachedBanner')}
          />
        ) : null}

        {!items.length ? (
          <EmptyState icon="notifications-outline" title={t('notifEmptyTitle')} message={t('notifEmptyMsg')} />
        ) : null}

        {sections.map((section) => {
          const entries = items.filter((item) => item.section === section);
          if (!entries.length) return null;

          return (
            <View key={section} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section}</Text>

              {entries.map((item, idx) => (
                <SurfaceCard key={`${section}-${idx}`} style={styles.card}>
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
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
                  </View>
                </SurfaceCard>
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
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: 16 },
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
  iconButtonDisabled: { opacity: 0.45 },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    ...Typography.eyebrow,
    color: Colors.light.subtitle,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
