import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { AppImage } from '@/components/ui/app-image';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useEvents } from '@/context/EventContext';
import { useFilters } from '@/context/FilterContext';
import { usePosts } from '@/context/PostContext';
import { useUser } from '@/context/UserContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const filters = ['Live music', 'Open air', 'Food', 'Late night'];
const discoveryPresets = [
  { id: 'all', label: 'All' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'popular', label: 'Popular' },
  { id: 'cheapest', label: 'Cheapest' },
] as const;

export default function HomeFeed() {
  const router = useRouter();
  const { posts } = usePosts();
  const { events, featuredEventId } = useEvents();
  const {
    filteredEvents,
    filters: activeFilters,
    toggleGenre,
    activeFilterCount,
    activePresetId,
    favoritePresetId,
    applyPreset,
    setSearchQuery,
  } = useFilters();
  const { user } = useUser();
  const latestPost = posts[0];
  const feedEvents = activeFilterCount ? filteredEvents : events;
  const featuredEvent =
    feedEvents.find((event) => event.id === featuredEventId) ?? feedEvents[0];
  const trendingEvents = feedEvents.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#241813', '#4a2a18', Colors.light.tintDark]} style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.heroTop}>
            <View style={styles.profileRow}>
              <AppImage source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" />
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>TONIGHT IN BRUSSELS</Text>
                <Text style={styles.heroTitle}>Find your next vibe, {user.username}</Text>
              </View>
            </View>

            <IconActionButton
              icon="notifications-outline"
              tone="dark"
              onPress={() => router.push('/notifications')}
            />
          </View>

          <Text style={styles.heroText}>
            Browse standout events, save memories and move through the city with your crew.
          </Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8d827a" />
            <TextInput
              value={activeFilters.searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search artists, places or moods"
              placeholderTextColor="#8d827a"
              style={styles.searchInput}
            />
            <TouchableOpacity onPress={() => router.push('/filters')}>
              <Ionicons name="options-outline" size={18} color="#8d827a" />
            </TouchableOpacity>
          </View>

          {activeFilterCount ? <Text style={styles.searchMeta}>{activeFilterCount} filters active</Text> : null}

          <View style={styles.metricRow}>
            <StatChip label="events nearby" value={feedEvents.length.toString()} tone="dark" />
            <StatChip label="captures saved" value={posts.length.toString().padStart(2, '0')} tone="dark" />
            <StatChip label="sort" value={activeFilters.sortBy.replace('_', ' ')} tone="dark" />
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick picks</Text>
            <Text style={styles.sectionSubtitle}>Explore by atmosphere</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {favoritePresetId ? (
            <TouchableOpacity
              style={[styles.presetChip, styles.favoritePresetChip]}
              onPress={() => applyPreset(favoritePresetId)}>
              <Ionicons name="star" size={14} color={Colors.light.tint} />
              <Text style={styles.favoritePresetText}>Saved</Text>
            </TouchableOpacity>
          ) : null}
          {discoveryPresets.map((preset) => {
            const active = activePresetId === preset.id;

            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => applyPreset(preset.id)}>
                <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{preset.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
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

        {featuredEvent ? (
          <LinearGradient colors={['#231b17', '#3a261d']} style={styles.featuredCard}>
            <View style={styles.featuredTop}>
              <View style={styles.featuredCopy}>
                <Text style={styles.featuredEyebrow}>FEATURED TONIGHT</Text>
                <Text style={styles.featuredTitle}>{featuredEvent.title}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </View>

            <Text style={styles.featuredDesc}>{featuredEvent.description}</Text>

            <View style={styles.featuredMeta}>
              <StatChip label="spot" value={featuredEvent.place} icon="pin-outline" tone="dark" />
              <StatChip label="time" value={featuredEvent.time} icon="time-outline" tone="dark" />
              <StatChip label="crowd" value={featuredEvent.attendees} icon="people-outline" tone="dark" />
            </View>

            <AppButton
              label="See details"
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

        {latestPost ? (
          <SurfaceCard style={styles.postCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Latest capture</Text>
                <Text style={styles.sectionSubtitle}>Your most recent moment</Text>
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
          <SurfaceCard style={styles.capturePrompt}>
            <View style={styles.promptIcon}>
              <Ionicons name="camera-outline" size={22} color={Colors.light.tint} />
            </View>
            <View style={styles.promptCopy}>
              <Text style={styles.promptTitle}>Start your capture streak</Text>
              <Text style={styles.promptText}>
                Take your first drink photo to unlock crowns and build your night recap.
              </Text>
            </View>
            <AppButton label="Open camera" onPress={() => router.push('/camera')} />
          </SurfaceCard>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Trending events</Text>
            <Text style={styles.sectionSubtitle}>Good energy, close to you</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => router.push('/filters')}>
            <Text style={styles.filterButtonText}>{activeFilters.sortBy === 'popular' ? 'Popular' : activeFilters.sortBy === 'soonest' ? 'Soonest' : 'Lowest price'}</Text>
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
                    <StatChip label="place" value={event.place} icon="pin-outline" />
                    <StatChip label="date" value={event.date} icon="calendar-outline" />
                    <StatChip label="time" value={event.time} icon="time-outline" />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.friendRow}>
                      <View style={styles.dot} />
                      <Text style={styles.friendText}>Friends are interested</Text>
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
          <EmptyState
            icon="options-outline"
            title="No events match yet"
            message="Try relaxing a filter or reset your picks to see more nights."
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/event/create')}>
          <LinearGradient colors={[Colors.light.tint, Colors.light.tintDark]} style={styles.fabInner}>
            <Ionicons name="add" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 160 },
  hero: {
    marginHorizontal: -16,
    marginTop: -16,
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    gap: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroCopy: { flex: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  heroEyebrow: { color: '#f3caa5', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: '#fff8f2', fontSize: 24, fontWeight: '800' },
  heroText: { color: '#ebddd1', fontSize: 16, lineHeight: 24, maxWidth: 320 },
  searchBox: {
    backgroundColor: '#fffaf5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#1f1a17', fontWeight: '600', paddingVertical: 0 },
  searchMeta: { color: '#f3caa5', fontSize: 12, fontWeight: '700', marginTop: -8 },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 22 },
  sectionSubtitle: { color: '#81776f', fontSize: 13 },
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  filterChip: { backgroundColor: '#efe3d5', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  filterChipActive: { backgroundColor: '#231b17' },
  filterChipText: { color: '#6e635c', fontWeight: '700' },
  filterChipTextActive: { color: '#fff7ef' },
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
  filterButton: { backgroundColor: '#efe3d5', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  filterButtonText: { color: '#1f1a17', fontWeight: '800', fontSize: 13 },
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
  fab: { position: 'absolute', right: 20, bottom: 18, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});
