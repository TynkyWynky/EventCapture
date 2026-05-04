import { AppButton } from '@/components/ui/app-button';
import { CrownProgressBar } from '@/components/ui/crown-progress-bar';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { getActiveCrownReward, getCrownLevelProgress } from '@/constants/crowns';
import { useEvents } from '@/context/EventContext';
import { usePosts } from '@/context/PostContext';
import { useUser } from '@/context/UserContext';
import { Colors, Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { posts, crowns } = usePosts();
  const { events } = useEvents();
  const { user } = useUser();
  const { t } = useLanguage();
  const rewardProgress = Math.min((crowns / 9) * 100, 100);
  const activeReward = getActiveCrownReward(crowns);
  const crownLevel = getCrownLevelProgress(crowns);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <LinearGradient
          colors={[TabThemes.profile.panel, '#30495f', TabThemes.profile.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}>
          <View style={styles.headerGlow} />
          <ScreenHeader
            eyebrow={t('profileTab')}
            title={user.username}
            subtitle={`${user.fullName} · ${user.city}`}
            leading={
              <View style={styles.avatarWrap}>
                <Image source={{ uri: user.avatarUri }} style={[styles.avatar, activeReward && styles.avatarRewarded]} />
                {activeReward ? (
                  <View style={styles.crownAuraBadge}>
                    <Ionicons name={activeReward.reward.icon} size={14} color={Colors.light.tint} />
                  </View>
                ) : null}
              </View>
            }
            rightAction={
              <View style={styles.headerActions}>
                <IconActionButton icon="notifications-outline" tone="dark" onPress={() => router.push('/notifications')} />
                <IconActionButton icon="menu" tone="dark" onPress={() => router.push('/menu')} />
              </View>
            }
            mode="compact"
            surface={false}
            tone="inverse"
          />

          <Text style={styles.bio}>{user.bio}</Text>

          <View style={styles.statsRow}>
            <StatChip label={t('profileStatPosts')} value={posts.length.toString()} tone="dark" />
            <StatChip label={t('profileStatCrowns')} value={crowns.toString()} tone="dark" />
            <StatChip label={t('profileStatEvents')} value={events.length.toString()} tone="dark" />
          </View>

          {activeReward ? (
            <View style={styles.rewardStrip}>
              <View style={styles.rewardStripIcon}>
                <Ionicons name={activeReward.reward.icon} size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.rewardStripCopy}>
                <Text style={styles.rewardStripTitle}>
                  {t('activeCrownPerk')} {activeReward.reward.perk}
                </Text>
                <Text style={styles.rewardStripText}>{activeReward.reward.detail}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View>
                <Text style={styles.levelEyebrow}>{t('crownLevelEyebrow')}</Text>
                <Text style={styles.levelTitle}>
                  {t('levelLabel')} {crownLevel.currentLevel.level} · {crownLevel.currentLevel.title}
                </Text>
              </View>
              <Text style={styles.levelMeta}>
                {crownLevel.nextLevel
                  ? `${crownLevel.crownsToNextLevel} ${t('crownsToNextLevel')} ${crownLevel.nextLevel.level}`
                  : t('maxLevelReached')}
              </Text>
            </View>

            <CrownProgressBar progress={crownLevel.progressWithinLevel} tone="dark" />
          </View>

          <AppButton label={t('editProfileBtn')} onPress={() => router.push('/profile/edit')} style={styles.editButton} />
        </LinearGradient>

        <SurfaceCard style={styles.sectionCard} variant="subtle">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('rewardProgressTitle')}</Text>
            <Text style={styles.sectionMeta}>{crowns}/9</Text>
          </View>

          <CrownProgressBar progress={rewardProgress} />

          <View style={styles.crownGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={[styles.crownBadge, i < crowns && styles.crownEarned]}>
                <Ionicons
                  name={i < crowns ? 'medal' : 'medal-outline'}
                  size={22}
                  color={i < crowns ? Colors.light.tint : '#9d938b'}
                />
              </View>
            ))}
          </View>

          <AppButton label={t('seeAllRewardsBtn')} variant="secondary" onPress={() => router.push('/achievements')} />
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('accountSnapshotTitle')}</Text>
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons name="mail-outline" size={18} color={Colors.light.tint} />
            </View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountLabel}>{t('emailLabel')}</Text>
              <Text style={styles.accountValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons name="location-outline" size={18} color={Colors.light.tint} />
            </View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountLabel}>{t('cityLabel')}</Text>
              <Text style={styles.accountValue}>{user.city}</Text>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard} variant="subtle">
          <Text style={styles.sectionTitle}>{t('aboutTitle')}</Text>
          <Text style={styles.aboutText}>{user.bio}</Text>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.profile.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: Layout.sectionGap },
  headerCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  headerGlow: {
    position: 'absolute',
    top: -42,
    right: -28,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(171, 212, 255, 0.14)',
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  avatarRewarded: {
    borderColor: 'rgba(244,123,32,0.72)',
    shadowColor: '#f7b06a',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  crownAuraBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    backgroundColor: '#f2f7ff',
    borderWidth: 1,
    borderColor: '#c4d7e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bio: { color: '#d6e1eb', lineHeight: 21 },
  headerActions: { gap: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rewardStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,247,239,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,169,0.14)',
    borderRadius: 18,
    padding: 12,
  },
  rewardStripIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: '#f0f5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardStripCopy: { flex: 1, gap: 2 },
  rewardStripTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 14.5 },
  rewardStripText: { color: '#d9c6b8', lineHeight: 18, fontSize: 12.5 },
  levelCard: {
    gap: 10,
    backgroundColor: 'rgba(255,247,239,0.1)',
    borderRadius: 18,
    padding: 12,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end' },
  levelEyebrow: { color: '#d6c4b7', fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  levelTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 16, marginTop: 4 },
  levelMeta: { color: '#d9c6b8', fontSize: 12.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  editButton: { marginTop: 2, backgroundColor: TabThemes.profile.accent },
  sectionCard: {
    gap: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e6f0',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: TabThemes.profile.panel, fontWeight: '800', fontSize: 20 },
  sectionMeta: { color: '#6d8091', fontWeight: '700' },
  crownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  crownBadge: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    backgroundColor: '#e8f0f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEarned: { backgroundColor: '#fff0de' },
  accountRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#e5eff7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCopy: { flex: 1, gap: 2 },
  accountLabel: { color: '#698095', fontSize: 12.5, fontWeight: '700' },
  accountValue: { color: TabThemes.profile.panel, fontSize: 15, fontWeight: '700' },
  aboutText: { color: '#65798a', lineHeight: 22 },
});
