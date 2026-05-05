import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { AppImage } from '@/components/ui/app-image';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { getActiveCrownReward, getCrownLevelProgress, getNextCrownReward } from '@/constants/crowns';
import { useEvents } from '@/context/EventContext';
import { useFilters } from '@/context/FilterContext';
import { usePosts } from '@/context/PostContext';
import { useUser } from '@/context/UserContext';
import { Colors, Layout, Radius, TabThemes } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeFeed() {
  const router = useRouter();
  const { posts, crowns, isOffline: postsOffline, isUsingCachedData: postsCached, error: postsError } = usePosts();
  const { events, featuredEventId, isOffline: eventsOffline, isUsingCachedData: eventsCached, error: eventsError } = useEvents();
  const { t } = useLanguage();

  const genreFilters = [t('filterGenreLive'), t('filterGenreElec'), t('filterGenreOpen'), t('filterGenreFood'), t('filterGenreOutdoor'), t('filterGenreLate')];
  const discoveryPresets = [
    { id: 'all', label: t('filterPresetAll'), icon: 'grid-outline' as const },
    { id: 'tonight', label: t('filterPresetTonight'), icon: 'moon-outline' as const },
    { id: 'popular', label: t('filterPresetPopular'), icon: 'flame-outline' as const },
    { id: 'cheapest', label: t('filterPresetCheapest'), icon: 'wallet-outline' as const },
    { id: 'open_air', label: t('filterPresetOpenAir'), icon: 'sunny-outline' as const },
  ] as const;
  const sortOptions = [
    { value: 'popular' as const, label: t('filterSortPopular') },
    { value: 'soonest' as const, label: t('filterSortSoonest') },
    { value: 'lowest_price' as const, label: t('filterSortLowest') },
  ];
  const {
    filteredEvents,
    filters: activeFilters,
    toggleGenre,
    activeFilterCount,
    activePresetId,
    favoritePresetId,
    applyPreset,
    setSearchQuery,
    setSortBy,
    resetFilters,
  } = useFilters();
  const { user } = useUser();
  const latestPost = posts[0];
  const feedEvents = activeFilterCount ? filteredEvents : events;
  const featuredEvent =
    feedEvents.find((event) => event.id === featuredEventId) ?? feedEvents[0];
  const trendingEvents = feedEvents.slice(0, 3);
  const activeReward = getActiveCrownReward(crowns);
  const nextReward = getNextCrownReward(crowns);
  const crownLevel = getCrownLevelProgress(crowns);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const cycleSortBy = () => {
    const currentIndex = sortOptions.findIndex((o) => o.value === activeFilters.sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex].value);
  };

  const currentSortLabel = sortOptions.find((o) => o.value === activeFilters.sortBy)?.label ?? t('filterSortPopular');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />
        }>

        {/* ====== HERO ====== */}
        <LinearGradient colors={['#241813', '#4a2a18', Colors.light.tintDark]} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroGlowSecondary} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroIdentity}>
              <View style={styles.avatarFrame}>
                <AppImage source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" />
              </View>
              <View style={styles.heroCopyWrap}>
                <Text style={styles.heroEyebrow}>{t('heroEyebrow')}</Text>
                <Text style={styles.heroTitle}>{`${t('heroTitle')}${user.username}`}</Text>
                <Text style={styles.heroSubtitle}>{t('heroText')}</Text>
              </View>
            </View>

            <View style={styles.heroActions}>
              <IconActionButton icon="notifications-outline" tone="dark" onPress={() => router.push('/notifications')} />
              <IconActionButton icon="menu" tone="dark" onPress={() => router.push('/menu')} />
            </View>
          </View>

          {/* ====== SEARCH BOX ====== */}
          <View style={styles.searchShell}>
            <View style={styles.searchBox}>
              <View style={styles.searchIconWrap}>
                <Ionicons name="search" size={18} color="#8d827a" />
              </View>
              <TextInput
                value={activeFilters.searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('searchPlaceholder')}
                placeholderTextColor="#8d827a"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {activeFilters.searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#b0a69e" />
                </TouchableOpacity>
              ) : null}
              <View style={styles.searchDivider} />
              <TouchableOpacity onPress={() => router.push('/filters')} style={styles.filterIconBtn}>
                <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? Colors.light.tint : '#8d827a'} />
                {activeFilterCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* ====== ACTIVE FILTER BAR ====== */}
          {activeFilterCount > 0 ? (
            <View style={styles.activeFilterBar}>
              <Text style={styles.activeFilterText}>
                {feedEvents.length} event{feedEvents.length !== 1 ? 's' : ''} · {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </Text>
              <TouchableOpacity onPress={resetFilters} style={styles.clearFiltersBtn}>
                <Ionicons name="close" size={13} color="#fff" />
                <Text style={styles.clearFiltersText}>{t('clearAllBtn')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ====== METRICS ====== */}
          <View style={styles.metricRow}>
            <StatChip label={t('feedStatEventsNearby')} value={feedEvents.length.toString()} tone="dark" compact />
            <StatChip label={t('feedStatCaptures')} value={posts.length.toString().padStart(2, '0')} tone="dark" compact />
            <TouchableOpacity onPress={cycleSortBy}>
              <StatChip label={t('feedStatSort')} value={currentSortLabel} tone="dark" icon="swap-vertical-outline" compact />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {eventsOffline || postsOffline || eventsCached || postsCached ? (
          <FeedbackBanner
            tone={eventsOffline || postsOffline ? 'error' : 'info'}
            title={eventsOffline || postsOffline ? 'Live data is unavailable' : 'Showing cached activity'}
            message={eventsError || postsError || 'Some content is coming from the last successful sync.'}
          />
        ) : null}

        {/* ====== DISCOVERY PRESETS ====== */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('quickPicksTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('quickPicksSub')}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {favoritePresetId ? (
            <TouchableOpacity
              style={[styles.presetChip, styles.favoritePresetChip]}
              onPress={() => applyPreset(favoritePresetId)}>
              <Ionicons name="star" size={14} color={Colors.light.tint} />
              <Text style={styles.favoritePresetText}>{t('savedPreset')}</Text>
            </TouchableOpacity>
          ) : null}
          {discoveryPresets.map((preset) => {
            const active = activePresetId === preset.id;

            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => applyPreset(preset.id)}>
                <Ionicons name={preset.icon} size={14} color={active ? Colors.light.tint : '#6e635c'} />
                <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{preset.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ====== GENRE CHIPS ====== */}
        <View style={styles.filterRow}>
          {genreFilters.map((filter) => {
            const active = activeFilters.selectedGenres.includes(filter);

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => toggleGenre(filter)}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ====== FEATURED EVENT ====== */}
        {featuredEvent ? (
          <LinearGradient colors={['#231b17', '#3a261d']} style={styles.featuredCard}>
            <View style={styles.featuredTop}>
              <View style={styles.featuredCopy}>
                <Text style={styles.featuredEyebrow}>{t('featuredTonight')}</Text>
                <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{t('liveBadge')}</Text>
              </View>
            </View>

            <Text style={styles.featuredDesc}>{featuredEvent.description}</Text>

            <View style={styles.featuredMeta}>
              <StatChip label={t('feedStatSpot')} value={featuredEvent.place} icon="pin-outline" tone="dark" />
              <StatChip label={t('detailStatTime')} value={featuredEvent.time} icon="time-outline" tone="dark" />
              <StatChip label={t('detailStatCrowd')} value={featuredEvent.attendees} icon="people-outline" tone="dark" />
            </View>

            <AppButton
              label={t('seeDetailsBtn')}
              onPress={() =>
                router.push({
                  pathname: '/event/detail',
                  params: { eventId: featuredEvent.id },
                })
              }
              style={styles.featuredButton}
            />
          </LinearGradient>
        ) : null}

        {/* ====== CROWN SPOTLIGHT ====== */}
        {activeReward ? (
          <SurfaceCard style={styles.crownSpotlightCard} variant="subtle">
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('crownSpotlightTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('crownSpotlightSub')}</Text>
              </View>
              <View style={styles.crownSpotlightIcon}>
                <Ionicons name={activeReward.reward.icon} size={18} color={Colors.light.tint} />
              </View>
            </View>

            <Text style={styles.crownSpotlightTitle}>
              Crown {activeReward.crownNumber} · {activeReward.reward.perk}
            </Text>
            <Text style={styles.crownSpotlightText}>{activeReward.reward.detail}</Text>

            <View style={styles.crownLevelBox}>
              <View style={styles.crownLevelHeader}>
                <Text style={styles.crownLevelTitle}>
                  Level {crownLevel.currentLevel.level} · {crownLevel.currentLevel.title}
                </Text>
                <Text style={styles.crownLevelMeta}>
                  {crownLevel.nextLevel
                    ? `${crownLevel.crownsToNextLevel} to Level ${crownLevel.nextLevel.level}`
                    : 'Maxed'}
                </Text>
              </View>
              <View style={styles.crownLevelProgressOuter}>
                <View style={[styles.crownLevelProgressFill, { width: `${crownLevel.progressWithinLevel}%` }]} />
              </View>
            </View>

            <View style={styles.crownSpotlightMeta}>
              <View style={styles.crownMetaChip}>
                <Ionicons name="sparkles-outline" size={14} color={Colors.light.tint} />
                <Text style={styles.crownMetaText}>{activeReward.milestone}</Text>
              </View>
              {nextReward ? (
                <View style={styles.crownMetaChip}>
                  <Ionicons name="arrow-forward-outline" size={14} color={Colors.light.tint} />
                  <Text style={styles.crownMetaText}>Next: {nextReward.reward.perk}</Text>
                </View>
              ) : null}
            </View>

            <AppButton label={t('openVaultBtn')} variant="secondary" onPress={() => router.push('/achievements')} />
          </SurfaceCard>
        ) : null}

        {/* ====== LATEST CAPTURE ====== */}
        {latestPost ? (
          <SurfaceCard style={styles.postCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('latestCaptureTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('latestCaptureSub')}</Text>
              </View>
              {latestPost.isBeerFinished ? (
                <View style={styles.rewardBadge}>
                  <Ionicons name="sparkles" size={14} color="#fff" />
                  <Text style={styles.rewardText}>1 crown</Text>
                </View>
              ) : null}
            </View>

            <AppImage source={{ uri: latestPost.imageUri }} style={styles.postImage} contentFit="cover" />
            <Text style={styles.cardTitle}>{latestPost.eventTitle || 'Captured moment'}</Text>
            <Text style={styles.cardMeta}>{latestPost.date}</Text>
          </SurfaceCard>
        ) : (
          <SurfaceCard style={styles.capturePrompt} variant="subtle">
            <View style={styles.promptIcon}>
              <Ionicons name="camera-outline" size={22} color={Colors.light.tint} />
            </View>
            <View style={styles.promptCopy}>
              <Text style={styles.promptTitle}>{t('startCaptureTitle')}</Text>
              <Text style={styles.promptText}>
                {t('startCaptureSub')}
              </Text>
            </View>
            <AppButton label={t('openCameraBtn')} onPress={() => router.push('/camera')} />
          </SurfaceCard>
        )}

        {/* ====== TRENDING EVENTS ====== */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('trendingTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('trendingSub')}</Text>
          </View>
          <TouchableOpacity style={styles.sortToggle} onPress={cycleSortBy}>
            <Ionicons name="swap-vertical-outline" size={14} color={Colors.light.tint} />
            <Text style={styles.sortToggleText}>{currentSortLabel}</Text>
          </TouchableOpacity>
        </View>

        {trendingEvents.length ? (
          trendingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
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
                      <Text style={styles.cardTitle}>{event.title}</Text>
                      <Text style={styles.cardMeta}>{event.vibe}</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>{event.price}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <StatChip label={t('plannerCardPlace')} value={event.place} icon="pin-outline" />
                    <StatChip label={t('detailStatDate')} value={event.date} icon="calendar-outline" />
                    <StatChip label={t('detailStatTime')} value={event.time} icon="time-outline" />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.friendRow}>
                      <View style={styles.dot} />
                      <Text style={styles.friendText}>{t('friendsInterested')}</Text>
                    </View>
                    <View style={styles.arrowWrap}>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            </TouchableOpacity>
          ))
        ) : (
          <SurfaceCard style={styles.emptyCard} variant="subtle">
            <EmptyState
              icon="options-outline"
              title={t('noEventsTitle')}
              message={t('noEventsSub')}
            />
            <AppButton label={t('clearAllBtn')} variant="secondary" onPress={resetFilters} />
          </SurfaceCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.index.background },
  content: { padding: Layout.screenPadding, paddingBottom: 160 },
  hero: {
    marginHorizontal: -Layout.screenPadding,
    marginTop: -Layout.screenPadding,
    paddingTop: 58,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 32,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    gap: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    right: -36,
    top: -42,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroGlowSecondary: {
    position: 'absolute',
    left: -78,
    bottom: -130,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingRight: 8,
  },
  avatarFrame: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroCopyWrap: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  heroActions: { flexDirection: 'row', gap: 8, paddingTop: 6 },
  avatar: { width: '100%', height: '100%', borderRadius: 28 },
  heroEyebrow: { color: '#f0c9a9', fontWeight: '800', fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase' },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 29, lineHeight: 34, maxWidth: 250 },
  heroSubtitle: { color: '#ead8ca', fontSize: 15, lineHeight: 24, maxWidth: 250 },

  // ---- Search ----
  searchShell: {
    borderRadius: 30,
    padding: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  searchBox: {
    backgroundColor: Colors.light.card,
    borderRadius: 29,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, color: '#1f1a17', fontWeight: '600', paddingVertical: 0, fontSize: 15 },
  searchDivider: { width: 1, height: 22, backgroundColor: '#e0d5ca', marginHorizontal: 2 },
  filterIconBtn: { position: 'relative', padding: 4, width: 28, alignItems: 'center' },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // ---- Active Filter Bar ----
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: -8,
  },
  activeFilterText: { color: '#f3caa5', fontSize: 13, fontWeight: '700' },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearFiltersText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ---- Metrics ----
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // ---- Section ----
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 22 },
  sectionSubtitle: { color: '#81776f', fontSize: 13 },

  // ---- Presets ----
  presetRow: { gap: 10, paddingBottom: 14 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetChipActive: {
    backgroundColor: '#fff1e0',
    borderColor: Colors.light.tint,
  },
  favoritePresetChip: {
    backgroundColor: '#fff6eb',
    borderColor: '#f5c28f',
  },
  presetChipText: { color: '#6e635c', fontWeight: '700' },
  presetChipTextActive: { color: Colors.light.tint },
  favoritePresetText: { color: Colors.light.tint, fontWeight: '800' },

  // ---- Genre Filters ----
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  filterChip: { backgroundColor: '#efe3d5', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  filterChipActive: { backgroundColor: '#231b17' },
  filterChipText: { color: '#6e635c', fontWeight: '700' },
  filterChipTextActive: { color: '#fff7ef' },

  // ---- Sort Toggle ----
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1e0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  sortToggleText: { color: Colors.light.tint, fontWeight: '800', fontSize: 13 },

  // ---- Featured ----
  featuredCard: {
    borderRadius: 28,
    padding: 22,
    gap: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  featuredCopy: { flex: 1 },
  featuredEyebrow: { color: '#f0c9a9', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  featuredTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 24, marginTop: 6 },
  featuredDesc: { color: '#d6c5b8', lineHeight: 21 },
  liveBadge: { backgroundColor: '#0f766e', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  liveBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.8 },
  featuredMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featuredButton: { marginTop: 2 },

  // ---- Crown ----
  crownSpotlightCard: { marginBottom: 20, gap: 12 },
  crownSpotlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownSpotlightTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 18 },
  crownSpotlightText: { color: '#756b64', lineHeight: 21 },
  crownLevelBox: {
    gap: 8,
    backgroundColor: '#fff2e4',
    borderRadius: 16,
    padding: 12,
  },
  crownLevelHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  crownLevelTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 14.5 },
  crownLevelMeta: { color: '#8a6e55', fontWeight: '700', fontSize: 12.5 },
  crownLevelProgressOuter: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#ead8c5',
    overflow: 'hidden',
  },
  crownLevelProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
  },
  crownSpotlightMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  crownMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#f7ede3',
  },
  crownMetaText: { color: '#6d635d', fontWeight: '700', fontSize: 12.5 },

  // ---- Posts ----
  postCard: { marginBottom: 20, gap: 12 },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f766e', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  rewardText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  postImage: { width: '100%', height: 180, borderRadius: 18 },
  capturePrompt: { gap: 14, marginBottom: 20 },
  promptIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCopy: { gap: 4 },
  promptTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 20 },
  promptText: { color: '#81776f', lineHeight: 21 },

  // ---- Events ----
  eventCard: { padding: 14, marginBottom: 16 },
  eventImage: { width: '100%', height: 190, borderRadius: 20, marginBottom: 14 },
  eventBody: { gap: 10 },
  eventHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  eventCopy: { flex: 1 },
  cardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 21 },
  cardMeta: { color: '#81776f', fontSize: 13.5, marginTop: 2 },
  priceBadge: { backgroundColor: '#231b17', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  priceText: { color: '#fff7ef', fontWeight: '800', fontSize: 12 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f766e' },
  friendText: { color: '#81776f', fontWeight: '600' },
  arrowWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' },

  // ---- Empty ----
  emptyCard: { gap: 14, marginBottom: 16 },
});
