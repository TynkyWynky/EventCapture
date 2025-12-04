import { usePosts } from '@/context/PostContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';

const avatar = 'https://i.pravatar.cc/120?img=64';

export default function ProfileScreen() {
  const router = useRouter();
  const { posts, crowns } = usePosts();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Username</Text>
              <Text style={styles.sub}>Full Name</Text>
            </View>
            <TouchableOpacity style={styles.bell} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bell} onPress={() => router.push('/menu')}>
              <Ionicons name="menu" size={22} color="#111" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Posts', value: posts.length.toString() },
              { label: 'Crowns', value: crowns.toString() },
              { label: 'Events', value: '3' },
            ].map(stat => (
              <View key={stat.label} style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.crownsCard}>
          <View style={styles.crownHeader}>
            <Text style={styles.crownsTitle}>Your Crowns</Text>
            <Text style={styles.crownsMeta}>{crowns}/9</Text>
          </View>
          <View style={styles.crownGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={[styles.crownBadge, i < crowns ? styles.crownEarned : null]}>
                <Ionicons
                  name={i < crowns ? 'medal' : 'medal-outline'}
                  size={24}
                  color={i < crowns ? Colors.light.tint : '#999'}
                />
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.viewAll} onPress={() => router.push('/achievements')}>
            <Text style={styles.viewAllText}>View All Achievements</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 4, marginTop: 16 }}>
          <Text style={styles.aboutLabel}>About me</Text>
          <Text style={styles.aboutText}>Tap to add a short bio about yourself.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { padding: 16, paddingBottom: 120 },
  headerCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#fff' },
  name: { color: '#fff', fontWeight: '800', fontSize: 18 },
  sub: { color: '#ffe1c4' },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontWeight: '800', fontSize: 16, color: Colors.light.tint },
  statLabel: { color: '#777', fontSize: 12 },
  editBtn: {
    marginTop: 14,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editText: { color: Colors.light.tint, fontWeight: '700' },
  crownsCard: {
    marginTop: 18,
    backgroundColor: '#fff6df',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  crownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  crownsTitle: { fontWeight: '800', fontSize: 16, color: '#b5690d' },
  crownsMeta: { fontWeight: '700', color: '#b5690d' },
  crownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  crownBadge: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0e6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEarned: { backgroundColor: '#ffe1c4' },
  viewAll: {
    marginTop: 12,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewAllText: { fontWeight: '700', color: '#b5690d' },
  aboutLabel: { fontWeight: '700', color: '#222', marginBottom: 4 },
  aboutText: { color: '#666', fontSize: 13.5 },
});
