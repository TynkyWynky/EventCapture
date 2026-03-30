import { IconActionButton } from '@/components/ui/icon-action-button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { useFilters } from '@/context/FilterContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyEventsScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const { filteredEvents, activeFilterCount } = useFilters();
  const { user } = useUser();
  const featuredEvents = (activeFilterCount ? filteredEvents : events).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.titleRow}>
            <Image source={{ uri: user.avatarUri }} style={styles.avatar} />
            <View style={styles.titleCopy}>
              <Text style={styles.eyebrow}>DISCOVER</Text>
              <Text style={styles.title}>{user.city} Events</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <IconActionButton icon="notifications-outline" onPress={() => router.push('/notifications')} />
            <IconActionButton icon="add" onPress={() => router.push('/event/create')} />
          </View>
        </View>

        <LinearGradient colors={['#231b17', '#4b2d1f']} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Your city is active tonight</Text>
          <Text style={styles.heroText}>
            Browse curated events and jump into the ones your friends are already watching.
          </Text>

          <View style={styles.heroStats}>
            <StatChip label="live picks" value={featuredEvents.length.toString()} tone="dark" />
            <StatChip label="city" value={user.city} tone="dark" />
            <StatChip label="filters" value={activeFilterCount.toString()} tone="dark" />
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured nights</Text>
            <Text style={styles.sectionSubtitle}>Curated picks that are already moving</Text>
          </View>
        </View>

        {featuredEvents.length ? (
          featuredEvents.map((event, index) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.92}
              onPress={() =>
                router.push({
                  pathname: '/event/detail',
                  params: { eventId: event.id },
                })
              }>
              <SurfaceCard style={[styles.eventCard, index % 2 === 0 && styles.eventCardWarm]}>
                <Image source={{ uri: event.heroImage }} style={styles.eventImage} contentFit="cover" />

                <View style={styles.eventBody}>
                  <View style={styles.eventHeader}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{event.date}</Text>
                    </View>
                    <Text style={styles.price}>{event.price}</Text>
                  </View>

                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardMeta}>{event.description}</Text>

                  <View style={styles.metaRow}>
                    <StatChip label="place" value={event.place} icon="pin-outline" />
                    <StatChip label="time" value={event.time} icon="time-outline" />
                  </View>

                  <View style={styles.bottomRow}>
                    <View style={styles.attendeesRow}>
                      <Ionicons name="people-outline" size={14} color="#81776f" />
                      <Text style={styles.attendees}>{event.attendees}</Text>
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
            icon="calendar-clear-outline"
            title="Nothing matches these filters"
            message="Try resetting your filters or widen the location and price range."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  titleCopy: { flex: 1 },
  eyebrow: { color: '#857a72', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  title: { color: '#1f1a17', fontWeight: '800', fontSize: 26 },
  actions: { flexDirection: 'row', gap: 10 },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    gap: 14,
  },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 24 },
  heroText: { color: '#d4c5b8', lineHeight: 21 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeader: { gap: 4 },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 22 },
  sectionSubtitle: { color: '#81776f', fontSize: 13 },
  eventCard: { padding: 12, gap: 12 },
  eventCardWarm: { backgroundColor: '#fff4eb' },
  eventImage: { width: '100%', height: 182, borderRadius: 20 },
  eventBody: { gap: 12 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  badge: {
    backgroundColor: '#f6eee4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#6c6159', fontWeight: '800', fontSize: 11 },
  price: { color: Colors.light.tint, fontWeight: '800', fontSize: 14 },
  cardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 20 },
  cardMeta: { color: '#81776f', lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attendees: { color: '#81776f', fontWeight: '600', fontSize: 12.5 },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
