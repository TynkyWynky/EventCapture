import { AppButton } from '@/components/ui/app-button';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useFilters } from '@/context/FilterContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const genres = ['Live music', 'Electronic', 'Food', 'Outdoor', 'Open air', 'Late night'];
const dateOptions = [
  { label: 'Today', value: 'today' as const },
  { label: 'Tomorrow', value: 'tomorrow' as const },
  { label: 'This week', value: 'this_week' as const },
];
const pricePresets = [
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under 15', min: 0, max: 15 },
  { label: 'Under 25', min: 0, max: 25 },
  { label: 'Any', min: 0, max: 120 },
];
const sortOptions = [
  { label: 'Most popular', value: 'popular' as const },
  { label: 'Soonest', value: 'soonest' as const },
  { label: 'Lowest price', value: 'lowest_price' as const },
];
const discoveryPresets = [
  { id: 'all', label: 'Reset all' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'popular', label: 'Popular' },
  { id: 'cheapest', label: 'Cheapest' },
  { id: 'open_air', label: 'Open air' },
] as const;

export default function FiltersScreen() {
  const router = useRouter();
  const {
    filters,
    activeFilterCount,
    activePresetId,
    favoritePresetId,
    filteredEvents,
    applyPreset,
    setSearchQuery,
    toggleGenre,
    setDateFilter,
    setSortBy,
    setLocation,
    setPriceRange,
    toggleFavoritePreset,
    resetFilters,
  } = useFilters();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="DISCOVER"
          title="Filters"
          subtitle="Shape the feed around the nights you actually want."
          onBack={() => router.back()}
          rightAction={<IconActionButton icon="refresh-outline" onPress={resetFilters} />}
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Refine the night</Text>
          <Text style={styles.heroText}>
            Your choices now affect the home feed and event discovery in real time.
          </Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroMetaText}>{filteredEvents.length} events match</Text>
            <Text style={styles.heroMetaText}>{activeFilterCount} active filters</Text>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick presets</Text>
          <View style={styles.chipRow}>
            {discoveryPresets.map((preset) => {
              const active = activePresetId === preset.id;

              return (
                <View key={preset.id} style={styles.presetWrap}>
                  <TouchableOpacity
                    style={[styles.genreChip, active && styles.genreChipActive]}
                    onPress={() => applyPreset(preset.id)}>
                    <Text style={[styles.genreText, active && styles.genreTextActive]}>{preset.label}</Text>
                  </TouchableOpacity>
                  {preset.id !== 'all' ? (
                    <TouchableOpacity
                      style={[styles.favoriteButton, favoritePresetId === preset.id && styles.favoriteButtonActive]}
                      onPress={() => toggleFavoritePreset(preset.id)}>
                      <Ionicons
                        name={favoritePresetId === preset.id ? 'star' : 'star-outline'}
                        size={14}
                        color={favoritePresetId === preset.id ? '#fff' : Colors.light.tint}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Search</Text>
          <View style={styles.locationInput}>
            <Ionicons name="search-outline" size={18} color={Colors.light.tint} />
            <TextInput
              value={filters.searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Artists, places, hosts, moods"
              placeholderTextColor="#8a7f77"
              style={styles.locationTextInput}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Genres and vibes</Text>
          <View style={styles.chipRow}>
            {genres.map((genre) => {
              const active = filters.selectedGenres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => toggleGenre(genre)}>
                  <Text style={[styles.genreText, active && styles.genreTextActive]}>{genre}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Time and date</Text>
          <View style={styles.row}>
            {dateOptions.map((option) => {
              const active = filters.dateFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setDateFilter(active ? 'all' : option.value)}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.optionCard} onPress={() => setDateFilter('all')}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={Colors.light.tint} />
            <Text style={styles.optionText}>
              {filters.dateFilter === 'all' ? 'No date limit' : `Selected: ${filters.dateFilter.replace('_', ' ')}`}
            </Text>
            <Ionicons name="close-circle-outline" size={16} color={Colors.light.tint} />
          </TouchableOpacity>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sort results</Text>
          <View style={styles.chipRow}>
            {sortOptions.map((option) => {
              const active = filters.sortBy === option.value;

              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setSortBy(option.value)}>
                  <Text style={[styles.genreText, active && styles.genreTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationInput}>
            <Ionicons name="location-outline" size={18} color={Colors.light.tint} />
            <TextInput
              value={filters.location}
              onChangeText={setLocation}
              placeholder="Brussels, Belgium"
              placeholderTextColor="#8a7f77"
              style={styles.locationTextInput}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price range</Text>
            <Text style={styles.priceHint}>
              {filters.minPrice} EUR - {filters.maxPrice} EUR
            </Text>
          </View>

          <View style={styles.chipRow}>
            {pricePresets.map((preset) => {
              const active = filters.minPrice === preset.min && filters.maxPrice === preset.max;
              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.genreChip, active && styles.genreChipActive]}
                  onPress={() => setPriceRange(preset.min, preset.max)}>
                  <Text style={[styles.genreText, active && styles.genreTextActive]}>{preset.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SurfaceCard>

        <View style={styles.actions}>
          <AppButton label="Reset" variant="secondary" style={styles.resetBtn} onPress={resetFilters} />
          <AppButton label={`Show ${filteredEvents.length} events`} style={styles.applyBtn} onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  heroCard: { backgroundColor: '#231b17', gap: 8 },
  heroTitle: { color: '#fff7ef', fontSize: 22, fontWeight: '800' },
  heroText: { color: '#d7c7bb', lineHeight: 21 },
  heroMeta: { flexDirection: 'row', gap: 18, marginTop: 4 },
  heroMetaText: { color: '#f6d6bb', fontWeight: '700' },
  sectionCard: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 19,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genreChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f3e7da',
  },
  genreChipActive: {
    backgroundColor: '#231b17',
  },
  genreText: { color: '#6f655e', fontWeight: '700' },
  genreTextActive: { color: '#fff7ef' },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1e0',
  },
  favoriteButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#fff2e5', borderWidth: 1, borderColor: Colors.light.tint },
  pillText: { color: '#6f655e', fontWeight: '700' },
  pillTextActive: { color: Colors.light.tint },
  optionCard: {
    backgroundColor: '#f8f1ea',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionText: { flex: 1, color: '#1f1a17', fontWeight: '700' },
  locationInput: {
    backgroundColor: '#f8f1ea',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationTextInput: { flex: 1, color: '#1f1a17', fontWeight: '700' },
  priceHint: { color: Colors.light.tint, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  resetBtn: { flex: 1 },
  applyBtn: { flex: 1.2 },
});
