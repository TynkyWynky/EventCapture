import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { BadgeThemes } from '@/constants/badgeThemes';
import { getCrownLevelProgress, getNextCrownReward } from '@/constants/crowns';
import { Colors, Layout, Radius, TabThemes } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { usePosts } from '@/context/PostContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSocial } from '@/context/SocialContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeFeed() {
  const router = useRouter();
  const { user } = useUser();
  const { unreadCount } = useSocial();
  const { t } = useLanguage();
  const {
    events,
    featuredEventId,
    refreshEvents,
    isOffline: eventsOffline,
    isUsingCachedData: eventsCached,
    error: eventsError,
  } = useEvents();
  const {
    posts,
    crowns,
    refreshPosts,
    isOffline: postsOffline,
    isUsingCachedData: postsCached,
    error: postsError,
  } = usePosts();
  const [refreshing, setRefreshing] = useState(false);

  const featuredEvent = useMemo(
    () => events.find((event) => event.id === featuredEventId) ?? events[0],
    [events, featuredEventId]
  );
  const trendingEvents = useMemo(
    () => events.filter((event) => event.id !== featuredEvent?.id).slice(0, 3),
    [events, featuredEvent?.id]
  );
  const latestPost = posts[0];
  const crownLevel = getCrownLevelProgress(crowns);
  const nextReward = getNextCrownReward(crowns);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshEvents(), refreshPosts()]);
    } catch {
      // Keep the current content visible if refresh fails.
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents, refreshPosts]);

  const showSyncBanner = eventsOffline || postsOffline || eventsCached || postsCached;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />
        }>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>{t('homeEyebrow')}</Text>
            <Text style={styles.headerTitle}>
              {t('homeTitle')} {user.username}
            </Text>
            <Text style={styles.headerSubtitle}>{t('homeSubtitle')}</Text>
          </View>

          <View style={styles.headerActions}>
            <IconActionButton
              icon="notifications-outline"
              accessibilityLabel={t('notifTitle')}
              unreadCount={unreadCount}
              onPress={() => router.push('/notifications')}
            />
            <IconActionButton icon="menu" accessibilityLabel={t('menuTitle')} onPress={() => router.push('/menu')} />
          </View>
        </View>

        {showSyncBanner ? (
          <FeedbackBanner
            tone={eventsOffline || postsOffline ? 'error' : 'info'}
            title={eventsOffline || postsOffline ? 'Live updates are unavailable' : 'Showing saved activity'}
            message={eventsError || postsError || 'Reconnect to refresh events, captures, and rewards.'}
          />
        ) : null}

        {featuredEvent ? (
          <LinearGradient colors={['#241813', '#4a2a18', Colors.light.tintDark]} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{t('homeTonightTitle')}</Text>
              </View>
              <Text style={styles.heroMeta}>{featuredEvent.date}</Text>
            </View>

            <Text style={styles.heroTitle}>{featuredEvent.title}</Text>
            <Text style={styles.heroSubtitleText}>{t('homeTonightSub')}</Text>
            <Text style={styles.heroDescription}>{featuredEvent.description}</Text>

            <View style={styles.heroStats}>
              <StatChip label={t('plannerCardPlace')} value={featuredEvent.place} tone="dark" icon="pin-outline" />
              <StatChip label={t('detailStatTime')} value={featuredEvent.time} tone="dark" icon="time-outline" />
              <StatChip label={t('detailStatCrowd')} value={featuredEvent.attendees} tone="dark" icon="people-outline" />
            </View>

            <View style={styles.heroActionsRow}>
              <AppButton
                label={t('seeDetailsBtn')}
                onPress={() =>
                  router.push({
                    pathname: '/event/detail',
                    params: { eventId: featuredEvent.id },
                  })
                }
                style={styles.heroPrimaryButton}
              />
              <AppButton
                label={t('homeBrowseEvents')}
                variant="secondary"
                onPress={() => router.push('/events')}
                style={styles.heroSecondaryButton}
                textStyle={styles.heroSecondaryText}
              />
            </View>
          </LinearGradient>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title={t('noEventsTitle')}
            message={t('noEventsSub')}
          />
        )}

        <SurfaceCard style={styles.quickActionsCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('homeQuickActions')}</Text>
              <Text style={styles.sectionSubtitle}>Move from discovery to capture without hunting through the app.</Text>
            </View>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('homeActionCapture')}
              style={styles.quickAction}
              activeOpacity={0.88}
              onPress={() => router.push('/camera')}>
              <View style={[styles.quickActionIcon, styles.quickActionWarm]}>
                <Ionicons name="camera-outline" size={18} color={Colors.light.tint} />
              </View>
              <Text style={styles.quickActionTitle}>{t('homeActionCapture')}</Text>
              <Text style={styles.quickActionText}>Take a qualifying shot and review the result.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('homeActionEvents')}
              style={styles.quickAction}
              activeOpacity={0.88}
              onPress={() => router.push('/events')}>
              <View style={[styles.quickActionIcon, styles.quickActionCool]}>
                <Ionicons name="calendar-outline" size={18} color="#157a74" />
              </View>
              <Text style={styles.quickActionTitle}>{t('homeActionEvents')}</Text>
              <Text style={styles.quickActionText}>Browse, compare, and filter the full event list.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('homeActionRewards')}
              style={styles.quickAction}
              activeOpacity={0.88}
              onPress={() => router.push('/achievements')}>
              <View style={[styles.quickActionIcon, styles.quickActionGold]}>
                <Ionicons name="ribbon-outline" size={18} color="#b97610" />
              </View>
              <Text style={styles.quickActionTitle}>{t('homeActionRewards')}</Text>
              <Text style={styles.quickActionText}>Check crown progress and your next unlock.</Text>
            </TouchableOpacity>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.progressCard} variant="subtle">
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('homeProgressTitle')}</Text>
              <Text style={styles.sectionSubtitle}>{t('homeProgressSub')}</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{crowns}</Text>
            </View>
          </View>

          <View style={styles.progressMeter}>
            <View style={[styles.progressFill, { width: `${crownLevel.progressWithinLevel}%` }]} />
          </View>

          <View style={styles.progressMetaRow}>
            <Text style={styles.progressMeta}>
              {t('levelLabel')} {crownLevel.currentLevel.level} · {crownLevel.currentLevel.title}
            </Text>
            <Text style={styles.progressMeta}>
              {crownLevel.nextLevel
                ? `${crownLevel.crownsToNextLevel} ${t('crownsToNextLevel')} ${crownLevel.nextLevel.level}`
                : t('maxLevelReached')}
            </Text>
          </View>

          {nextReward ? (
            <View style={styles.nextRewardRow}>
              <Ionicons name="sparkles-outline" size={16} color={Colors.light.tint} />
              <Text style={styles.nextRewardText}>Next unlock: {nextReward.reward.perk}</Text>
            </View>
          ) : null}
        </SurfaceCard>

        {latestPost ? (
          <SurfaceCard style={styles.captureCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('latestCaptureTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('homeLatestCaptureSub')}</Text>
              </View>
              {latestPost.isBeerFinished ? (
                <View
                  style={[
                    styles.captureBadge,
                    {
                      backgroundColor: BadgeThemes.mojito.background,
                      borderColor: BadgeThemes.mojito.border,
                    },
                  ]}>
                  <Ionicons name="sparkles" size={14} color={BadgeThemes.mojito.icon} />
                  <Text style={[styles.captureBadgeText, { color: BadgeThemes.mojito.text }]}>{t('socialCrownBadge')}</Text>
                </View>
              ) : null}
            </View>

            <AppImage source={{ uri: latestPost.imageUri }} style={styles.captureImage} contentFit="cover" />
            <Text style={styles.captureTitle}>{latestPost.eventTitle || 'Captured moment'}</Text>
            <Text style={styles.captureMeta}>{latestPost.date}</Text>
          </SurfaceCard>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('trendingTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('trendingSub')}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('homeBrowseEvents')}
            style={styles.inlineLink}
            onPress={() => router.push('/events')}>
            <Text style={styles.inlineLinkText}>{t('homeBrowseEvents')}</Text>
          </TouchableOpacity>
        </View>

        {trendingEvents.length ? (
          trendingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              accessibilityRole="button"
              accessibilityLabel={event.title}
              activeOpacity={0.92}
              onPress={() =>
                router.push({
                  pathname: '/event/detail',
                  params: { eventId: event.id },
                })
              }>
              <SurfaceCard style={styles.eventCard}>
                <AppImage source={{ uri: event.heroImage }} style={styles.eventImage} contentFit="cover" />
                <View style={styles.eventBody}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventCopy}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventMeta}>{event.vibe}</Text>
                    </View>
                    <View
                      style={[
                        styles.priceBadge,
                        {
                          backgroundColor: BadgeThemes.stout.background,
                          borderColor: BadgeThemes.stout.border,
                        },
                      ]}>
                      <Text style={[styles.priceText, { color: BadgeThemes.stout.text }]}>{event.price}</Text>
                    </View>
                  </View>

                  <View style={styles.eventStats}>
                    <StatChip label={t('plannerCardPlace')} value={event.place} icon="pin-outline" />
                    <StatChip label={t('detailStatDate')} value={event.date} icon="calendar-outline" />
                  </View>
                </View>
              </SurfaceCard>
            </TouchableOpacity>
          ))
        ) : (
          <SurfaceCard style={styles.emptyCard} variant="subtle">
            <EmptyState icon="options-outline" title={t('noEventsTitle')} message={t('noEventsSub')} />
            <AppButton label={t('homeBrowseEvents')} variant="secondary" onPress={() => router.push('/events')} />
          </SurfaceCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.index.background },
  content: { padding: Layout.screenPadding, paddingBottom: 160, gap: 18 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  headerCopy: { flex: 1, gap: 6 },
  headerEyebrow: { color: '#8d6c56', fontWeight: '800', fontSize: 11, letterSpacing: 1.1 },
  headerTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 28, lineHeight: 32 },
  headerSubtitle: { color: '#756b64', fontSize: 14.5, lineHeight: 22 },
  headerActions: { flexDirection: 'row', gap: 8 },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    gap: 14,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  heroBadge: {
    backgroundColor: BadgeThemes.aperitif.background,
    borderWidth: 1,
    borderColor: BadgeThemes.aperitif.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: { color: BadgeThemes.aperitif.text, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  heroMeta: { color: '#f0c9a9', fontWeight: '700', fontSize: 12.5 },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 28, lineHeight: 32 },
  heroSubtitleText: { color: '#f0c9a9', fontWeight: '700', fontSize: 13.5 },
  heroDescription: { color: '#ead8ca', lineHeight: 22 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroActionsRow: { flexDirection: 'row', gap: 10 },
  heroPrimaryButton: { flex: 1 },
  heroSecondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroSecondaryText: { color: '#fff7ef' },
  quickActionsCard: { gap: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 21 },
  sectionSubtitle: { color: '#81776f', fontSize: 13, lineHeight: 18 },
  quickActionsRow: { gap: 12 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: Radius.xl,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ede1d6',
    padding: 14,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionWarm: { backgroundColor: '#fff1e0' },
  quickActionCool: { backgroundColor: '#e6f5f2' },
  quickActionGold: { backgroundColor: '#fff5df' },
  quickActionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 15, marginBottom: 3 },
  quickActionText: { flex: 1, color: '#756b64', lineHeight: 19, fontSize: 12.5 },
  progressCard: { gap: 12 },
  progressBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BadgeThemes.lager.background,
    borderWidth: 1,
    borderColor: BadgeThemes.lager.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  progressBadgeText: { color: BadgeThemes.lager.text, fontWeight: '800', fontSize: 15 },
  progressMeter: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#ead8c5',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
  },
  progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  progressMeta: { flex: 1, color: '#756b64', fontWeight: '700', fontSize: 12.5 },
  nextRewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextRewardText: { color: '#4f4741', fontWeight: '700', fontSize: 12.5 },
  captureCard: { gap: 12 },
  captureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  captureBadgeText: { fontWeight: '700', fontSize: 12 },
  captureImage: { width: '100%', height: 176, borderRadius: 18 },
  captureTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 19 },
  captureMeta: { color: '#81776f', fontSize: 13 },
  inlineLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff1e0',
  },
  inlineLinkText: { color: Colors.light.tint, fontWeight: '800', fontSize: 12.5 },
  eventCard: { padding: 14, gap: 12 },
  eventImage: { width: '100%', height: 164, borderRadius: 18 },
  eventBody: { gap: 10 },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eventCopy: { flex: 1 },
  eventTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 20 },
  eventMeta: { color: '#81776f', fontSize: 13.5, marginTop: 2 },
  priceBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  priceText: { fontWeight: '800', fontSize: 12 },
  eventStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emptyCard: { gap: 14 },
});
