import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const avatar = 'https://i.pravatar.cc/120?img=64';

const events = [
  {
    title: 'Rooftop Session',
    date: '18 Jul',
    place: 'Ixelles',
    attendees: '128 going',
  },
  {
    title: 'Midnight Vinyl Club',
    date: '24 Aug',
    place: 'Saint-Gilles',
    attendees: '92 going',
  },
  {
    title: 'Canal Lights Open Air',
    date: '07 Sep',
    place: 'Molenbeek',
    attendees: '208 going',
  },
  {
    title: 'Afterwork Tasting',
    date: '14 Sep',
    place: 'Brussels Center',
    attendees: '63 going',
  },
];

export default function MyEventsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.titleRow}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.eyebrow}>DISCOVER</Text>
              <Text style={styles.title}>Events</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#1f1a17" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/event/create')}>
              <Ionicons name="add" size={20} color="#1f1a17" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Your city is active tonight</Text>
          <Text style={styles.heroText}>Browse curated events and jump into the ones your friends are already watching.</Text>
        </View>

        <View style={styles.grid}>
          {events.map((event, index) => (
            <TouchableOpacity key={event.title} style={[styles.card, index % 2 === 0 && styles.cardWarm]} activeOpacity={0.92} onPress={() => router.push('/event/detail')}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>{event.date}</Text>
              </View>
              <View style={styles.box} />
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.cardMeta}>{event.place}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.attendees}>{event.attendees}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.light.tint} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  eyebrow: { color: '#857a72', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 },
  title: { color: '#1f1a17', fontWeight: '800', fontSize: 26 },
  actions: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fffaf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ead7c2',
  },
  heroCard: {
    backgroundColor: '#231b17',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 22 },
  heroText: { color: '#d4c5b8', lineHeight: 21, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    width: '47%',
    backgroundColor: '#fffaf5',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardWarm: { backgroundColor: '#fff2e6' },
  dateBadge: { alignSelf: 'flex-start', backgroundColor: '#f6eee4', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  dateBadgeText: { color: '#6c6159', fontWeight: '800', fontSize: 11 },
  box: { height: 96, backgroundColor: '#e5d6c6', borderRadius: 14, marginBottom: 10 },
  cardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 16 },
  cardMeta: { color: '#81776f', fontSize: 12.5, marginTop: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  attendees: { color: '#81776f', fontWeight: '600', fontSize: 12.5 },
});
