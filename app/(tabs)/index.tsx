import { usePosts } from '@/context/PostContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';

const avatar = 'https://i.pravatar.cc/120?img=64';

const sampleEvents = [
  {
    title: 'Rooftop Session',
    place: 'Ixelles',
    date: '18 Jul',
    time: '20:30',
    tags: 'Live set, rooftop',
    price: '18 EUR',
    image:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Night Market Afterparty',
    place: 'Brussels Center',
    date: '24 Aug',
    time: '22:00',
    tags: 'Food, DJ set',
    price: '12 EUR',
    image:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
  },
];

const filters = ['Live music', 'Open air', 'Food', 'Late night'];

export default function HomeFeed() {
  const router = useRouter();
  const { posts } = usePosts();
  const latestPost = posts[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#241813', '#4a2a18', Colors.light.tintDark]} style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.heroTop}>
            <View style={styles.profileRow}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <View>
                <Text style={styles.heroEyebrow}>TONIGHT IN BRUSSELS</Text>
                <Text style={styles.heroTitle}>Find your next vibe</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.heroAction} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#fff7ef" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroText}>Browse standout events, save memories and move through the city with your crew.</Text>

          <TouchableOpacity style={styles.searchBox} activeOpacity={0.9} onPress={() => router.push('/filters')}>
            <Ionicons name="search" size={18} color="#8d827a" />
            <Text style={styles.searchText}>Search artists, places or moods</Text>
            <Ionicons name="options-outline" size={18} color="#8d827a" />
          </TouchableOpacity>

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>24</Text>
              <Text style={styles.metricLabel}>events nearby</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{posts.length.toString().padStart(2, '0')}</Text>
              <Text style={styles.metricLabel}>captures saved</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>08</Text>
              <Text style={styles.metricLabel}>friends active</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick picks</Text>
            <Text style={styles.sectionSubtitle}>Explore by atmosphere</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter, index) => (
            <TouchableOpacity key={filter} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, index === 0 && styles.filterChipTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient colors={['#231b17', '#3a261d']} style={styles.featuredCard}>
          <View style={styles.featuredTop}>
            <View>
              <Text style={styles.featuredEyebrow}>FEATURED TONIGHT</Text>
              <Text style={styles.featuredTitle}>Electronic Harbor Session</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.featuredDesc}>Sunset visuals, electronic sets and a crowd that actually feels alive.</Text>

          <View style={styles.featuredMeta}>
            <View style={styles.metaPill}>
              <Ionicons name="pin-outline" size={14} color="#f6d6bb" />
              <Text style={styles.metaText}>Brussels Canal</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={14} color="#f6d6bb" />
              <Text style={styles.metaText}>22:30</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="people-outline" size={14} color="#f6d6bb" />
              <Text style={styles.metaText}>420 going</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.featuredButton} onPress={() => router.push('/event/detail')}>
            <Text style={styles.featuredButtonText}>See details</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {latestPost ? (
          <View style={styles.postCard}>
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

            <Image source={{ uri: latestPost.imageUri }} style={styles.postImage} contentFit="cover" />
            <Text style={styles.cardTitle}>{latestPost.eventTitle || 'Captured moment'}</Text>
            <Text style={styles.cardMeta}>{latestPost.date}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Trending events</Text>
            <Text style={styles.sectionSubtitle}>Good energy, close to you</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => router.push('/filters')}>
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {sampleEvents.map((event) => (
          <TouchableOpacity key={event.title} activeOpacity={0.92} style={styles.eventCard} onPress={() => router.push('/event/detail')}>
            <Image source={{ uri: event.image }} style={styles.eventImage} contentFit="cover" />

            <View style={styles.eventBody}>
              <View style={styles.eventHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  <Text style={styles.cardMeta}>{event.tags}</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>{event.price}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoPill}>
                  <Ionicons name="pin-outline" size={14} color="#6f655e" />
                  <Text style={styles.infoText}>{event.place}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Ionicons name="calendar-outline" size={14} color="#6f655e" />
                  <Text style={styles.infoText}>{event.date}</Text>
                </View>
                <View style={styles.infoPill}>
                  <Ionicons name="time-outline" size={14} color="#6f655e" />
                  <Text style={styles.infoText}>{event.time}</Text>
                </View>
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
          </TouchableOpacity>
        ))}

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
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)' },
  heroEyebrow: { color: '#f3caa5', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: '#fff8f2', fontSize: 24, fontWeight: '800' },
  heroAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  searchText: { flex: 1, color: '#8d827a', fontWeight: '600' },
  metricRow: { flexDirection: 'row', gap: 10 },
  metric: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  metricValue: { color: '#fff7ef', fontWeight: '800', fontSize: 22 },
  metricLabel: { color: '#e7d2c4', fontSize: 12, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 22 },
  sectionSubtitle: { color: '#81776f', fontSize: 13 },
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
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  featuredEyebrow: { color: '#f0c9a9', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  featuredTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 24, marginTop: 6, maxWidth: 230 },
  featuredDesc: { color: '#d6c5b8', lineHeight: 21 },
  liveBadge: { backgroundColor: '#0f766e', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  liveBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.8 },
  featuredMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: { color: '#f6d6bb', fontWeight: '700', fontSize: 12 },
  featuredButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  featuredButtonText: { color: '#fff', fontWeight: '800' },
  postCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f766e', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  rewardText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  postImage: { width: '100%', height: 180, borderRadius: 18, marginBottom: 12 },
  filterButton: { backgroundColor: '#efe3d5', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  filterButtonText: { color: '#1f1a17', fontWeight: '800', fontSize: 13 },
  eventCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 26,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  eventImage: { width: '100%', height: 190, borderRadius: 20, marginBottom: 14 },
  eventBody: { gap: 10 },
  eventHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 21 },
  cardMeta: { color: '#81776f', fontSize: 13.5, marginTop: 2 },
  priceBadge: { backgroundColor: '#231b17', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  priceText: { color: '#fff7ef', fontWeight: '800', fontSize: 12 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f6eee4', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  infoText: { color: '#6f655e', fontWeight: '600', fontSize: 13.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f766e' },
  friendText: { color: '#81776f', fontWeight: '600' },
  arrowWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 18, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  fabInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});
