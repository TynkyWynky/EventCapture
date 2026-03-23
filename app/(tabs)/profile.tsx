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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Username</Text>
              <Text style={styles.sub}>Full name · Brussels</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#1f1a17" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/menu')}>
              <Ionicons name="menu" size={22} color="#1f1a17" />
            </TouchableOpacity>
          </View>

          <Text style={styles.bio}>Capturing nights, collecting crowns and keeping the best event memories close.</Text>

          <View style={styles.statsRow}>
            {[
              { label: 'Posts', value: posts.length.toString() },
              { label: 'Crowns', value: crowns.toString() },
              { label: 'Events', value: '3' },
            ].map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile/edit')}>
            <Text style={styles.editText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reward progress</Text>
            <Text style={styles.sectionMeta}>{crowns}/9</Text>
          </View>

          <View style={styles.progressOuter}>
            <View style={[styles.progressFill, { width: `${Math.min((crowns / 9) * 100, 100)}%` }]} />
          </View>

          <View style={styles.crownGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <View key={i} style={[styles.crownBadge, i < crowns && styles.crownEarned]}>
                <Ionicons
                  name={i < crowns ? 'medal' : 'medal-outline'}
                  size={22}
                  color={i < crowns ? Colors.light.tint : '#9d938b'}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/achievements')}>
            <Text style={styles.secondaryBtnText}>See all rewards</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Tap to add a short bio about yourself, your favourite event types and what kind of nights you never miss.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 18 },
  headerCard: {
    backgroundColor: '#231b17',
    borderRadius: 26,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  name: { color: '#fff7ef', fontWeight: '800', fontSize: 22 },
  sub: { color: '#decfc2', marginTop: 2 },
  bio: { color: '#decfc2', lineHeight: 21, marginTop: 14 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fffaf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: '#fffaf5', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  statValue: { color: Colors.light.tint, fontWeight: '800', fontSize: 18 },
  statLabel: { color: '#7f756d', fontSize: 12, marginTop: 4 },
  editBtn: { marginTop: 14, backgroundColor: Colors.light.tint, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  editText: { color: '#fff', fontWeight: '800' },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 20 },
  sectionMeta: { color: '#8a7f77', fontWeight: '700' },
  progressOuter: { height: 10, backgroundColor: '#efe3d5', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.light.tint, borderRadius: 999 },
  crownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  crownBadge: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#f4ece3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEarned: { backgroundColor: '#fff0de' },
  secondaryBtn: { marginTop: 14, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ead7c2' },
  secondaryBtnText: { color: '#1f1a17', fontWeight: '700' },
  aboutText: { color: '#81776f', lineHeight: 22, marginTop: 10 },
});
