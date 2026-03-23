import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const crowns = [
  { title: 'Sunset Brewery Fest', date: '15 Oct 2024', address: 'Brussels Center', icon: 'medal-outline' },
  { title: 'Rooftop Session', date: '28 Nov 2024', address: 'Ixelles', icon: 'ribbon-outline' },
  { title: 'Canal Lights Open Air', date: '07 Jan 2025', address: 'Molenbeek', icon: 'trophy-outline' },
];

export default function AchievementsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>REWARDS</Text>
            <Text style={styles.title}>Achievements</Text>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={20} color="#1f1a17" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <Ionicons name="medal-outline" size={22} color={Colors.light.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>Reward progress</Text>
              <Text style={styles.progressSubtitle}>Keep capturing events to unlock all 9 crowns.</Text>
            </View>
            <Text style={styles.progressCount}>5/9</Text>
          </View>

          <View style={styles.progressBarOuter}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unlocked at</Text>
          <Text style={styles.sectionMeta}>Recent rewards</Text>
        </View>

        {crowns.map((crown) => (
          <View key={crown.title} style={styles.crownCard}>
            <View style={styles.badge}>
              <Ionicons name={crown.icon as any} size={26} color={Colors.light.tint} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.crownTitle}>{crown.title}</Text>
              <Text style={styles.crownMeta}>{crown.date}</Text>
              <Text style={styles.crownMeta}>{crown.address}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#857a72',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#1f1a17',
    fontSize: 26,
    fontWeight: '800',
  },
  progressCard: {
    backgroundColor: '#231b17',
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#fff7ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: { color: '#fff7ef', fontSize: 20, fontWeight: '800' },
  progressSubtitle: { color: '#d8c7ba', marginTop: 4, lineHeight: 19 },
  progressCount: { color: '#f6d6bb', fontWeight: '800' },
  progressBarOuter: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '55%',
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 999,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#857a72', fontWeight: '700' },
  crownCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 16 },
  crownMeta: { color: '#81776f', fontSize: 12.5, marginTop: 3 },
});
