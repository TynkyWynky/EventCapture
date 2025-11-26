import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Colors } from '@/constants/theme';

const crowns = [
  { title: 'Event Name', date: 'Event Date', address: 'Event Address', icon: 'medal-outline' },
  { title: 'Event Name', date: 'Event Date', address: 'Event Address', icon: 'ribbon-outline' },
  { title: 'Event Name', date: 'Event Date', address: 'Event Address', icon: 'trophy-outline' },
];

export default function AchievementsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="medal-outline" size={24} color="#fff" />
            <View>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressSubtitle}>Keep going to unlock all</Text>
            </View>
          </View>
          <View style={styles.progressBarOuter}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Earned At:</Text>
        {crowns.map((crown, idx) => (
          <View key={idx} style={styles.crownCard}>
            <Ionicons name={crown.icon as any} size={32} color={Colors.light.tint} />
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
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { padding: 16, paddingBottom: 120 },
  progressCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  progressHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  progressTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  progressSubtitle: { color: '#ffe1c4', fontSize: 13 },
  progressBarOuter: {
    height: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '55%',
    height: '100%',
    backgroundColor: '#d37a0f',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12 },
  crownCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  crownTitle: { fontWeight: '700', color: '#222' },
  crownMeta: { color: '#666', fontSize: 12.5 },
});
