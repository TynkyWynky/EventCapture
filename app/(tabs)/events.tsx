import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { EventRecord } from '@/constants/events';
import { Layout, Radius, Spacing, TabThemes, Typography } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { useFilters } from '@/context/FilterContext';
import { useLanguage } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useUser();
  const { events } = useEvents();
  const {
    filteredEvents,
    activeFilterCount,
    activePresetId,
    favoritePresetId,
    applyPreset,
    filters,
    resetFilters,
  } = useFilters();

  const visibleEvents = activeFilterCount ? filteredEvents : events;
  const featuredEvents = visibleEvents.slice(0, 3);
  const discoveryPresets = [
    { id: 'all', label: t('filterPresetAll') },
    { id: 'tonight', label: t('filterPresetTonight') },
    { id: 'popular', label: t('filterPresetPopular') },
    { id: 'cheapest', label: t('filterPresetCheapest') },
    { id: 'open_air', label: t('filterPresetOpenAir') },
  ] as const;

  const renderEventCard = ({
    item,
    index,
  }: {
    item: EventRecord;
    index: number;
  }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={item.title}
      activeOpacity={0.92}
      onPress={() =>
        router.push({
          pathname: '/event/detail',
          params: { eventId: item.id },
        })
      }>
      <SurfaceCard
        style={[styles.eventCard, index === 0 && styles.eventCardFeatured]}
        variant={index === 0 ? 'feature' : 'default'}>
        <AppImage source={{ uri: item.heroImage }} style={styles.eventImage} contentFit="cover" />

        <View style={styles.eventBody}>
          <View style={styles.eventHeader}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{item.date}</Text>
            </View>
            <Text style={styles.price}>{item.price}</Text>
          </View>

          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.description}</Text>

          <View style={styles.metaRow}>
            <StatChip label={t('plannerCardPlace')} value={item.place} icon="pin-outline" compact />
            <StatChip label={t('detailStatTime')} value={item.time} icon="time-outline" compact />
            <StatChip label={t('detailStatCrowd')} value={item.attendees} icon="people-outline" compact />
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.cardFootnote}>{item.vibe}</Text>
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </View>
      </SurfaceCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={visibleEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            <ScreenHeader
              eyebrow={t('discoverEyebrow')}
              title={`${user.city}${t('discoverTitle')}`}
              subtitle={t('eventsSubtitle')}
              mode="compact"
              leading={<AppImage source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" />}
              rightAction={
                <View style={styles.headerActions}>
                  <IconActionButton
                    icon="notifications-outline"
                    accessibilityLabel={t('notifTitle')}
                    onPress={() => router.push('/notifications')}
                  />
                  <IconActionButton
                    icon="menu"
                    accessibilityLabel={t('menuTitle')}
                    onPress={() => router.push('/menu')}
                  />
                </View>
              }
            />

            <SurfaceCard style={styles.utilityCard}>
              <View style={styles.utilityTop}>
                <View style={styles.utilityCopy}>
                  <Text style={styles.utilityTitle}>{t('eventsUtilityTitle')}</Text>
                  <Text style={styles.utilityText}>{t('eventsUtilitySub')}</Text>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t('eventsFilterButton')}
                  style={styles.filterButton}
                  onPress={() => router.push('/filters')}>
                  <Ionicons name="options-outline" size={16} color={TabThemes.events.accent} />
                  <Text style={styles.filterButtonText}>{t('eventsFilterButton')}</Text>
                  {activeFilterCount > 0 ? (
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <StatChip label={t('eventsResultLabel')} value={visibleEvents.length.toString()} icon="albums-outline" />
                <StatChip label={t('sortStat')} value={filters.sortBy.replace('_', ' ')} icon="swap-vertical-outline" />
                <StatChip label={t('cityStat')} value={filters.location || user.city} icon="pin-outline" />
              </View>

              {activeFilterCount > 0 ? (
                <View style={styles.activeRow}>
                  <Text style={styles.activeText}>
                    {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t('eventsResetButton')}
                    style={styles.resetPill}
                    onPress={resetFilters}>
                    <Text style={styles.resetPillText}>{t('eventsResetButton')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </SurfaceCard>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
              {favoritePresetId ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t('savedPreset')}
                  style={[styles.presetChip, styles.favoritePresetChip]}
                  onPress={() => applyPreset(favoritePresetId)}>
                  <Ionicons name="star" size={14} color={TabThemes.events.accent} />
                  <Text style={styles.favoritePresetText}>{t('savedPreset')}</Text>
                </TouchableOpacity>
              ) : null}

              {discoveryPresets.map((preset) => {
                const active = activePresetId === preset.id;

                return (
                  <TouchableOpacity
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={preset.label}
                    style={[styles.presetChip, active && styles.presetChipActive]}
                    onPress={() => applyPreset(preset.id)}>
                    <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{preset.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <LinearGradient
              colors={[TabThemes.events.panel, '#17514c', TabThemes.events.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}>
              <View style={styles.heroGlow} />
              <Text style={styles.heroTitle}>{t('exploreHeroTitle')}</Text>
              <Text style={styles.heroText}>{t('exploreHeroText')}</Text>

              <View style={styles.heroStats}>
                <StatChip label={t('livePicksStat')} value={visibleEvents.length.toString()} tone="dark" />
                <StatChip label={t('cityStat')} value={user.city} tone="dark" />
                <StatChip label={t('sortStat')} value={filters.sortBy.replace('_', ' ')} tone="dark" />
              </View>
            </LinearGradient>

            {featuredEvents.length ? (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>{t('featuredNightsTitle')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('featuredNightsSub')}</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}>
                  {featuredEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      accessibilityRole="button"
                      accessibilityLabel={event.title}
                      activeOpacity={0.92}
                      style={styles.featuredCardWrap}
                      onPress={() =>
                        router.push({
                          pathname: '/event/detail',
                          params: { eventId: event.id },
                        })
                      }>
                      <SurfaceCard style={styles.featuredCard} variant="subtle">
                        <AppImage source={{ uri: event.heroImage }} style={styles.featuredImage} contentFit="cover" />
                        <Text style={styles.featuredTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.featuredMeta} numberOfLines={1}>
                          {event.place} · {event.time}
                        </Text>
                      </SurfaceCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('eventsBrowseAllTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('eventsBrowseAllSub')}</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard} variant="subtle">
            <EmptyState
              icon="calendar-clear-outline"
              title={t('noFiltersMatchTitle')}
              message={t('noFiltersMatchSub')}
            />
            <AppButton label={t('eventsNoResultsAction')} variant="secondary" onPress={resetFilters} />
          </SurfaceCard>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TabThemes.events.background,
  },
  container: {
    padding: Layout.screenPadding,
    paddingBottom: Layout.bottomPad,
    gap: Layout.sectionGap,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  utilityCard: {
    gap: 14,
  },
  utilityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  utilityCopy: {
    flex: 1,
    gap: 4,
  },
  utilityTitle: {
    color: TabThemes.events.panel,
    ...Typography.titleSm,
  },
  utilityText: {
    color: '#5d7774',
    lineHeight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.round,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e4f6f2',
    borderWidth: 1,
    borderColor: '#b9ddd7',
  },
  filterButtonText: {
    color: TabThemes.events.accent,
    fontWeight: '800',
    fontSize: 12.5,
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: TabThemes.events.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  activeText: {
    color: '#5d7774',
    fontWeight: '700',
    fontSize: 12.5,
  },
  resetPill: {
    borderRadius: Radius.round,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7ece8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetPillText: {
    color: TabThemes.events.accent,
    fontWeight: '800',
    fontSize: 12.5,
  },
  presetRow: {
    gap: 10,
    paddingBottom: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.round,
    backgroundColor: '#fcfffe',
    borderWidth: 1,
    borderColor: '#d7ece8',
  },
  presetChipActive: {
    backgroundColor: '#e4f6f2',
    borderColor: TabThemes.events.accent,
  },
  favoritePresetChip: {
    backgroundColor: '#effaf8',
    borderColor: '#9fd2cb',
  },
  presetChipText: {
    color: '#6e635c',
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: TabThemes.events.accent,
  },
  favoritePresetText: {
    color: TabThemes.events.accent,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    gap: 14,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -42,
    right: -24,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTitle: {
    color: '#fff7ef',
    ...Typography.titleMd,
  },
  heroText: {
    color: '#d5ece8',
    lineHeight: 21,
    maxWidth: 300,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featuredRow: {
    gap: 12,
    paddingBottom: 2,
  },
  featuredCardWrap: {
    width: 210,
  },
  featuredCard: {
    gap: 10,
  },
  featuredImage: {
    width: '100%',
    height: 120,
    borderRadius: Radius.lg,
  },
  featuredTitle: {
    color: TabThemes.events.panel,
    ...Typography.sectionTitle,
  },
  featuredMeta: {
    color: '#5d7774',
    fontSize: 13,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: TabThemes.events.panel,
    ...Typography.titleSm,
  },
  sectionSubtitle: {
    color: '#5d7774',
    fontSize: 13,
  },
  eventCard: {
    padding: Spacing.md,
    gap: Spacing.md,
    marginBottom: Layout.sectionGap,
  },
  eventCardFeatured: {
    borderColor: '#b7ddd7',
    borderWidth: 1,
  },
  eventImage: {
    width: '100%',
    height: 182,
    borderRadius: Radius.lg,
  },
  eventBody: {
    gap: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  dateBadge: {
    backgroundColor: '#e1f4f0',
    borderRadius: Radius.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateBadgeText: {
    color: '#25665f',
    fontWeight: '800',
    fontSize: 11,
  },
  price: {
    color: TabThemes.events.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  cardTitle: {
    color: TabThemes.events.panel,
    ...Typography.titleSm,
  },
  cardMeta: {
    color: '#5f7471',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardFootnote: {
    flex: 1,
    color: '#6f867f',
    fontSize: 13,
    fontWeight: '600',
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: TabThemes.events.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    gap: 14,
  },
});
