import { IconActionButton } from '@/components/ui/icon-action-button';
import { EmptyState } from '@/components/ui/empty-state';
import { AppImage } from '@/components/ui/app-image';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { EventRecord } from '@/constants/events';
import { Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { useFilters } from '@/context/FilterContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyEventsScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const {
    filteredEvents,
    activeFilterCount,
    activePresetId,
    favoritePresetId,
    applyPreset,
    filters,
  } = useFilters();
  const { user } = useUser();
  const { t } = useLanguage();
  const visibleEvents = activeFilterCount ? filteredEvents : events;

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
      activeOpacity={0.92}
      onPress={() =>
        router.push({
          pathname: '/event/detail',
          params: { eventId: item.id },
        })
      }>
      <SurfaceCard
        style={[styles.eventCard, index % 2 === 0 && styles.eventCardWarm]}
        variant={index === 0 ? 'feature' : 'default'}>
        <AppImage source={{ uri: item.heroImage }} style={styles.eventImage} contentFit="cover" />

        <View style={styles.eventBody}>
          <View style={styles.eventHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.date}</Text>
            </View>
            <Text style={styles.price}>{item.price}</Text>
          </View>

          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.description}</Text>

          <View style={styles.metaRow}>
            <StatChip label={t('plannerCardPlace')} value={item.place} icon="pin-outline" />
            <StatChip label={t('detailStatTime')} value={item.time} icon="time-outline" />
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.attendeesRow}>
              <Ionicons name="people-outline" size={14} color="#81776f" />
              <Text style={styles.attendees}>{item.attendees}</Text>
            </View>
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
              subtitle={t('featuredNightsSub')}
              leading={
                <AppImage source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" />
              }
              mode="compact"
              rightAction={
                <View style={styles.actions}>
                  <IconActionButton
                    icon="notifications-outline"
                    onPress={() => router.push('/notifications')}
                  />
                  <IconActionButton icon="add" onPress={() => router.push('/event/create')} />
                  <IconActionButton icon="menu" onPress={() => router.push('/menu')} />
                </View>
              }
            />

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

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('featuredNightsTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('featuredNightsSub')}</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetRow}>
              {favoritePresetId ? (
                <TouchableOpacity
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
                    style={[styles.presetChip, active && styles.presetChipActive]}
                    onPress={() => applyPreset(preset.id)}>
                    <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-clear-outline"
            title={t('noFiltersMatchTitle')}
            message={t('noFiltersMatchSub')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.events.background },
  container: {
    padding: Layout.screenPadding,
    paddingBottom: Layout.bottomPad,
    gap: Layout.sectionGap,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  actions: { flexDirection: 'row', gap: 10 },
  heroCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    gap: 14,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -34,
    right: -24,
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: 'rgba(149, 247, 224, 0.14)',
  },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 24 },
  heroText: { color: '#d4c5b8', lineHeight: 21 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeader: { gap: 4 },
  sectionTitle: { color: TabThemes.events.panel, fontWeight: '800', fontSize: 22 },
  sectionSubtitle: { color: '#5d7774', fontSize: 13 },
  presetRow: { gap: 10, paddingBottom: 4 },
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
  eventCard: { padding: Spacing.md, gap: Spacing.md, marginBottom: Layout.sectionGap },
  eventCardWarm: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d7ece8' },
  eventImage: { width: '100%', height: 182, borderRadius: 20 },
  eventBody: { gap: 12 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  badge: {
    backgroundColor: '#e1f4f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#25665f', fontWeight: '800', fontSize: 11 },
  price: { color: TabThemes.events.accent, fontWeight: '800', fontSize: 14 },
  cardTitle: { color: TabThemes.events.panel, fontWeight: '800', fontSize: 20 },
  cardMeta: { color: '#5f7471', lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attendees: { color: '#5f7471', fontWeight: '600', fontSize: 12.5 },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TabThemes.events.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
