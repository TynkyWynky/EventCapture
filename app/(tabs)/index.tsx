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
    title: 'Sunset Brewery Fest',
    place: 'Elsene',
    date: '18/07/2025',
    tags: 'Country, Metal',
    price: '€120',
    image:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Rock Night',
    place: 'Brussels Center',
    date: '24/08/2025',
    tags: 'Rock, Indie',
    price: '€60',
    image:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function HomeFeed() {
  const router = useRouter();
  const { posts } = usePosts();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[Colors.light.tint, '#ec7c0e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.topBar, { padding: 16, marginHorizontal: -16, marginTop: -16, paddingTop: 60 }]}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#666" />
            <Text style={styles.searchPlaceholder}>Search events</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/menu')}>
            <Ionicons name="menu" size={24} color="#111" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.tabRow}>
          {['Feeds', 'Events', 'My Posts'].map((label, i) => {
            const active = i === 0; // Default to Feeds for now
            return (
              <TouchableOpacity key={label} style={[styles.pill, active && styles.pillActive]}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User Posts Section */}
        {posts.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Recent Posts</Text>
            {posts.map((post) => (
              <View key={post.id} style={styles.card}>
                <Image source={{ uri: post.imageUri }} style={styles.cardImage} contentFit="cover" />
                <View style={styles.cardBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.cardTitle}>{post.eventTitle}</Text>
                    {post.isBeerFinished && (
                      <Ionicons name="ribbon" size={24} color="#d4af37" />
                    )}
                  </View>
                  <Text style={styles.infoText}>{post.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Text style={styles.sectionSubtitle}>Discover events</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => router.push('/filters')}>
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {sampleEvents.map((event, idx) => (
          <View key={event.title} style={[styles.card, idx === 0 && styles.cardPrimary]}>
            <Image source={{ uri: event.image }} style={styles.cardImage} contentFit="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <View style={styles.infoRow}>
                <Ionicons name="pin-outline" size={16} color="#555" />
                <Text style={styles.infoText}>{event.place}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#555" />
                <Text style={styles.infoText}>{event.date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="musical-notes-outline" size={16} color="#555" />
                <Text style={styles.infoText}>{event.tags}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="euro" size={16} color="#555" />
                <Text style={styles.infoText}>{event.price}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.detailsBtn, idx === 0 ? styles.detailsBtnPrimary : null]}
              onPress={() => router.push('/event/detail')}>
              <Text style={[styles.detailsText, idx === 0 && { color: '#fff' }]}>Details</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={idx === 0 ? '#fff' : Colors.light.tint}
              />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/event/create')}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 120 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchPlaceholder: { color: '#777', marginLeft: 8, fontSize: 14 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pill: {
    flex: 1,
    backgroundColor: '#e6e6e6',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#6c63ff' },
  pillText: { color: '#555', fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  sectionSubtitle: { fontSize: 13, color: '#777' },
  filterBtn: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterText: { color: '#6c63ff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPrimary: {
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  cardImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  cardBody: { gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { color: '#555', fontSize: 13.5 },
  detailsBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e6f6ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailsBtnPrimary: { backgroundColor: Colors.light.tint },
  detailsText: { color: Colors.light.tint, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
