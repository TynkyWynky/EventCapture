import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { useFilters } from '@/context/FilterContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { events, isOffline, isUsingCachedData, error } = useEvents();
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
  const discoveryPresets = [
    { id: 'all', label: t('filterPresetAll') },
    { id: 'tonight', label: t('filterPresetTonight') },
    { id: 'popular', label: t('filterPresetPopular') },
    { id: 'cheapest', label: t('filterPresetCheapest') },
    { id: 'open_air', label: t('filterPresetOpenAir') },
  ] as const;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('discoverEyebrow')}
          title={t('eventsTitle')}
          subtitle={t('eventsSubtitle')}
          mode="compact"
          leading={
            <View style={styles.headerBadge}>
              <Ionicons name="calendar-outline" size={20} color={TabThemes.events.accent} />
            </View>
          }
          rightAction={
            <View style={styles.headerActions}>
              <IconActionButton
                icon="notifications-outline"
                accessibilityLabel={t('notifTitle')}
                onPress={() => router.push('/notifications')}
              />
              <IconActionButton icon="menu" accessibilityLabel={t('menuTitle')} onPress={() => router.push('/menu')} />
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
            <StatChip label={t('cityStat')} value={filters.location || 'Brussels'} icon="pin-outline" />
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

        {isOffline || isUsingCachedData ? (
          <FeedbackBanner
            tone={isOffline ? 'error' : 'info'}
            title={isOffline ? 'Live event updates are unavailable' : 'Showing cached events'}
            message={error ?? 'Reconnect to refresh the latest event list.'}
          />
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('eventsBrowseAllTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('eventsBrowseAllSub')}</Text>
          </View>
        </View>

        {visibleEvents.length ? (
          visibleEvents.map((event) => (
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
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{event.date}</Text>
                    </View>
                    <Text style={styles.price}>{event.price}</Text>
                  </View>

                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardMeta}>{event.description}</Text>

                  <View style={styles.metaRow}>
                    <StatChip label={t('plannerCardPlace')} value={event.place} icon="pin-outline" />
                    <StatChip label={t('detailStatTime')} value={event.time} icon="time-outline" />
                    <StatChip label={t('detailStatCrowd')} value={event.attendees} icon="people-outline" />
                  </View>
                </View>
              </SurfaceCard>
            </TouchableOpacity>
          ))
        ) : (
          <SurfaceCard style={styles.emptyCard} variant="subtle">
            <EmptyState icon="calendar-clear-outline" title={t('noFiltersMatchTitle')} message={t('noFiltersMatchSub')} />
            <AppButton label={t('eventsNoResultsAction')} variant="secondary" onPress={resetFilters} />
          </SurfaceCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.events.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: Layout.sectionGap },
  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: '#effaf8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7ece8',
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  utilityCard: { gap: 14 },
  utilityTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  utilityCopy: { flex: 1, gap: 4 },
  utilityTitle: { color: TabThemes.events.panel, fontWeight: '800', fontSize: 20 },
  utilityText: { color: '#5d7774', lineHeight: 20 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e4f6f2',
    borderWidth: 1,
    borderColor: '#b9ddd7',
  },
  filterButtonText: { color: TabThemes.events.accent, fontWeight: '800', fontSize: 12.5 },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: TabThemes.events.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  activeText: { color: '#5d7774', fontWeight: '700', fontSize: 12.5 },
  resetPill: {
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d7ece8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetPillText: { color: TabThemes.events.accent, fontWeight: '800', fontSize: 12.5 },
  presetRow: { gap: 10, paddingBottom: 2 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
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
  presetChipText: { color: '#6e635c', fontWeight: '700' },
  presetChipTextActive: { color: TabThemes.events.accent },
  favoritePresetText: { color: TabThemes.events.accent, fontWeight: '800' },
  sectionHeader: { gap: 4 },
  sectionTitle: { color: TabThemes.events.panel, fontWeight: '800', fontSize: 22 },
  sectionSubtitle: { color: '#5d7774', fontSize: 13 },
  eventCard: { padding: Spacing.md, gap: Spacing.md },
  eventImage: { width: '100%', height: 182, borderRadius: 20 },
  eventBody: { gap: 12 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  dateBadge: {
    backgroundColor: '#e1f4f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateBadgeText: { color: '#25665f', fontWeight: '800', fontSize: 11 },
  price: { color: TabThemes.events.accent, fontWeight: '800', fontSize: 14 },
  cardTitle: { color: TabThemes.events.panel, fontWeight: '800', fontSize: 20 },
  cardMeta: { color: '#5f7471', lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emptyCard: { gap: 14 },
});
