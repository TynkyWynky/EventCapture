import { AppButton } from '@/components/ui/app-button';
import { CrownProgressBar } from '@/components/ui/crown-progress-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { CROWN_MILESTONES, CROWN_REWARDS, CROWN_TARGET, getCrownLevelProgress } from '@/constants/crowns';
import { Colors, Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { usePosts } from '@/context/PostContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AchievementsScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const { crowns, posts } = usePosts();
  const { t } = useLanguage();

  const rewardProgress = Math.min((crowns / CROWN_TARGET) * 100, 100);
  const remainingCrowns = Math.max(CROWN_TARGET - crowns, 0);
  const beerFinishedPosts = posts.filter((post) => post.isBeerFinished);
  const nextMilestoneIndex = Math.min(crowns, CROWN_TARGET - 1);
  const nextEvent = events[crowns % Math.max(events.length, 1)];
  const crownLevel = getCrownLevelProgress(crowns);

  const crownJourney = Array.from({ length: CROWN_TARGET }).map((_, index) => {
    const status = index < crowns ? 'unlocked' : index === crowns ? 'next' : 'locked';

    return {
      id: `crown-${index + 1}`,
      index: index + 1,
      label: CROWN_MILESTONES[index],
      reward: CROWN_REWARDS[index],
      status,
    };
  });

  const recentWins = beerFinishedPosts.slice(0, 3).map((post, index) => {
    const linkedEvent = events.find((event) => event.id === post.eventId);

    return {
      id: post.id,
      title: linkedEvent?.title ?? post.eventTitle ?? 'Captured moment',
      date: post.date,
      place: linkedEvent?.place ?? 'Event moment logged',
      icon:
        index === 0
          ? 'sparkles-outline'
          : index === 1
            ? 'flame-outline'
            : 'diamond-outline',
    };
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('achvEyebrow')}
          title={t('achvTitle')}
          subtitle={t('achvSubtitle')}
          onBack={() => router.back()}
          mode="compact"
          leading={
            <View style={styles.headerBadge}>
              <Ionicons name="medal-outline" size={20} color={Colors.light.tint} />
            </View>
          }
          rightAction={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconActionButton icon="notifications-outline" onPress={() => router.push('/notifications')} />
              <IconActionButton icon="menu" onPress={() => router.push('/menu')} />
            </View>
          }
        />

        <LinearGradient colors={['#231b17', '#3d261b', '#6a3d1e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Ionicons name="diamond-outline" size={24} color={Colors.light.tint} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{t('achvCurrentStreak')}</Text>
              <Text style={styles.heroTitle}>{crowns} {t('achvCrownsCollected')}</Text>
              <Text style={styles.heroSubtitle}>
                {remainingCrowns === 0
                  ? t('achvStreakSubMax')
                  : `${remainingCrowns} ${t('achvStreakSubMore')}`}
              </Text>
            </View>
          </View>

          <CrownProgressBar progress={rewardProgress} tone="dark" height={12} />

          <View style={styles.heroStats}>
            <StatChip label={t('achvStatsCrowns')} value={crowns.toString()} tone="dark" />
            <StatChip label={t('achvStatsWins')} value={beerFinishedPosts.length.toString()} tone="dark" />
            <StatChip label={t('achvStatsLeft')} value={remainingCrowns.toString()} tone="dark" />
          </View>

          <View style={styles.levelStrip}>
            <View style={styles.levelStripHeader}>
              <View>
                <Text style={styles.levelStripEyebrow}>{t('achvCurrentLevel')}</Text>
                <Text style={styles.levelStripTitle}>
                  {t('levelLabel')} {crownLevel.currentLevel.level} · {crownLevel.currentLevel.title}
                </Text>
              </View>
              <Text style={styles.levelStripMeta}>
                {crownLevel.nextLevel
                  ? `${crownLevel.crownsToNextLevel} ${t('crownsToNextLevel')} ${crownLevel.nextLevel.level}`
                  : t('achvLegendComplete')}
              </Text>
            </View>

            <CrownProgressBar progress={crownLevel.progressWithinLevel} tone="dark" />
          </View>
        </LinearGradient>

        <SurfaceCard style={styles.nextCard} variant="feature">
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>{t('achvNextUnlock')}</Text>
              <Text style={styles.sectionMeta}>
                Crown {Math.min(crowns + 1, CROWN_TARGET)} · {CROWN_MILESTONES[nextMilestoneIndex]}
              </Text>
            </View>
            <View style={styles.nextBadge}>
              <Ionicons name="trophy-outline" size={20} color={Colors.light.tint} />
            </View>
          </View>

          <Text style={styles.nextCopy}>
            {remainingCrowns === 0
              ? t('achvNextCopyMax')
              : `${t('achvNextCopyMore')} ${nextEvent?.title ?? t('achvYourNextEvent')}${t('achvNextCopyMore2')}`}
          </Text>

          <View style={styles.inlineMetaRow}>
            <View style={styles.inlineMetaChip}>
              <Ionicons name="calendar-outline" size={14} color={Colors.light.tint} />
              <Text style={styles.inlineMetaText}>{nextEvent?.fullDate ?? t('achvAnyUpcomingNight')}</Text>
            </View>
            <View style={styles.inlineMetaChip}>
              <Ionicons name="location-outline" size={14} color={Colors.light.tint} />
              <Text style={styles.inlineMetaText}>{nextEvent?.place ?? t('achvYourNextEvent')}</Text>
            </View>
          </View>
        </SurfaceCard>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('achvCrownJourney')}</Text>
          <Text style={styles.sectionMeta}>{crowns}/{CROWN_TARGET} {t('achvUnlockedStat')}</Text>
        </View>

        <View style={styles.milestoneGrid}>
          {crownJourney.map((milestone) => {
            const unlocked = milestone.status === 'unlocked';
            const isNext = milestone.status === 'next';

            return (
              <SurfaceCard
                key={milestone.id}
                style={[
                  styles.milestoneCard,
                  unlocked && styles.milestoneUnlocked,
                  isNext && styles.milestoneNext,
                ]}>
                <View
                  style={[
                    styles.milestoneIcon,
                    unlocked && styles.milestoneIconUnlocked,
                    isNext && styles.milestoneIconNext,
                  ]}>
                  <Ionicons
                    name={unlocked ? 'medal' : isNext ? 'sparkles' : 'medal-outline'}
                    size={20}
                    color={unlocked || isNext ? Colors.light.tint : '#9d938b'}
                  />
                </View>
                <Text style={styles.milestoneIndex}>Crown {milestone.index}</Text>
                <Text style={styles.milestoneLabel}>{milestone.label}</Text>
                <Text style={styles.milestoneReward}>{milestone.reward.perk}</Text>
                <Text style={[styles.milestoneState, unlocked && styles.milestoneStateUnlocked, isNext && styles.milestoneStateNext]}>
                  {unlocked ? t('achvStatusUnlocked') : isNext ? t('achvStatusNext') : t('achvStatusLocked')}
                </Text>
              </SurfaceCard>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('achvVaultRewards')}</Text>
          <Text style={styles.sectionMeta}>{t('achvVaultRewardsSub')}</Text>
        </View>

        <SurfaceCard style={styles.rewardVaultCard}>
          {crownJourney.map((milestone, index) => {
            const unlocked = milestone.status === 'unlocked';
            const isNext = milestone.status === 'next';

            return (
              <View
                key={`${milestone.id}-reward`}
                style={[
                  styles.rewardRow,
                  index === crownJourney.length - 1 && styles.rewardRowLast,
                  unlocked && styles.rewardRowUnlocked,
                  isNext && styles.rewardRowNext,
                ]}>
                <View
                  style={[
                    styles.rewardIconWrap,
                    unlocked && styles.rewardIconWrapUnlocked,
                    isNext && styles.rewardIconWrapNext,
                  ]}>
                  <Ionicons
                    name={milestone.reward.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={unlocked || isNext ? Colors.light.tint : '#9d938b'}
                  />
                </View>

                <View style={styles.rewardCopy}>
                  <Text style={styles.rewardTitle}>
                    Crown {milestone.index} · {milestone.reward.perk}
                  </Text>
                  <Text style={styles.rewardDetail}>{milestone.reward.detail}</Text>
                </View>

                <Text style={[styles.rewardStatus, unlocked && styles.milestoneStateUnlocked, isNext && styles.milestoneStateNext]}>
                  {unlocked ? t('achvStatusLive') : isNext ? t('achvStatusNext') : t('achvStatusSoon')}
                </Text>
              </View>
            );
          })}
        </SurfaceCard>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('achvRecentWins')}</Text>
          <Text style={styles.sectionMeta}>{t('achvRecentWinsSub')}</Text>
        </View>

        {recentWins.length > 0 ? (
          recentWins.map((win) => (
            <SurfaceCard key={win.id} style={styles.winCard} variant="subtle">
              <View style={styles.winBadge}>
                <Ionicons name={win.icon as keyof typeof Ionicons.glyphMap} size={24} color={Colors.light.tint} />
              </View>
              <View style={styles.winCopy}>
                <Text style={styles.winTitle}>{win.title}</Text>
                <Text style={styles.winMeta}>{win.place}</Text>
                <Text style={styles.winMeta}>{win.date}</Text>
              </View>
            </SurfaceCard>
          ))
        ) : (
          <EmptyState
            icon="beer-outline"
            title="No crown moments yet"
            message="Finish your first drink capture to start filling your crown vault."
          />
        )}

        <AppButton label={t('achvCaptureAnother')} onPress={() => router.push('/camera')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.achievements.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: Layout.sectionGap },
  heroCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
  },
  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: '#fff4e8',
    borderWidth: 1,
    borderColor: '#f1d7b9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    top: -56,
    right: -24,
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: 'rgba(255, 208, 166, 0.12)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#fff6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroEyebrow: {
    color: '#d7c4b6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: { color: '#fff7ef', fontSize: 28, fontWeight: '900', marginTop: 4 },
  heroSubtitle: { color: '#dfd0c4', lineHeight: 21, marginTop: 8 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  levelStrip: {
    gap: 10,
    backgroundColor: 'rgba(255,247,239,0.08)',
    borderRadius: Radius.lg,
    padding: 12,
  },
  levelStripHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end' },
  levelStripEyebrow: {
    color: '#d7c4b6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  levelStripTitle: { color: '#fff7ef', fontSize: 17, fontWeight: '800', marginTop: 4 },
  levelStripMeta: { color: '#dfd0c4', fontWeight: '700', fontSize: 12.5, flexShrink: 1, textAlign: 'right' },
  nextCard: { gap: 14 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#857a72', fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  nextBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: { color: '#6f655e', lineHeight: 21 },
  inlineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#f7ede3',
  },
  inlineMetaText: { color: '#6d635d', fontWeight: '700', fontSize: 12.5 },
  milestoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestoneCard: {
    width: '47%',
    gap: 10,
    backgroundColor: '#fbf6f1',
  },
  milestoneUnlocked: {
    backgroundColor: '#fff2e1',
    borderColor: '#f5cb98',
  },
  milestoneNext: {
    backgroundColor: '#fff8ef',
    borderColor: '#efc28b',
  },
  milestoneIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#f1e8de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconUnlocked: { backgroundColor: '#ffe7c9' },
  milestoneIconNext: { backgroundColor: '#fff0dc' },
  milestoneIndex: { color: '#8a7d73', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  milestoneLabel: { color: '#1f1a17', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  milestoneReward: { color: '#6f655e', lineHeight: 19, minHeight: 38 },
  milestoneState: { color: '#8a7d73', fontWeight: '700' },
  milestoneStateUnlocked: { color: '#b35d12' },
  milestoneStateNext: { color: Colors.light.tint },
  rewardVaultCard: { gap: 2 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#efe3d5',
  },
  rewardRowLast: { borderBottomWidth: 0, paddingBottom: 4 },
  rewardRowUnlocked: { opacity: 1 },
  rewardRowNext: { backgroundColor: '#fffaf4', borderRadius: 16, paddingHorizontal: 10 },
  rewardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#f1e8de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconWrapUnlocked: { backgroundColor: '#ffe7c9' },
  rewardIconWrapNext: { backgroundColor: '#fff0dc' },
  rewardCopy: { flex: 1, gap: 3 },
  rewardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 14.5 },
  rewardDetail: { color: '#7c726b', lineHeight: 19, fontSize: 12.5 },
  rewardStatus: { color: '#8a7d73', fontWeight: '800', fontSize: 12 },
  winCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  winBadge: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCopy: { flex: 1 },
  winTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 16 },
  winMeta: { color: '#81776f', fontSize: 12.5, marginTop: 3 },
});
