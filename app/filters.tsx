import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const genres = ['Live music', 'Electronic', 'Food', 'Outdoor'];

export default function FiltersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DISCOVER</Text>
            <Text style={styles.title}>Filters</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="refresh-outline" size={20} color="#1f1a17" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Refine the night</Text>
          <Text style={styles.heroText}>Shape your feed around the type of events, timing and energy you actually want to see.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Genres & vibes</Text>
          <View style={styles.chipRow}>
            {genres.map((g, idx) => {
              const active = idx === 1;
              return (
                <TouchableOpacity key={g} style={[styles.genreChip, active && styles.genreChipActive]}>
                  <Text style={[styles.genreText, active && styles.genreTextActive]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Time & date</Text>
          <View style={styles.row}>
            {['Today', 'Tomorrow', 'This week'].map((t, idx) => {
              const active = idx === 1;
              return (
                <TouchableOpacity key={t} style={[styles.pill, active && styles.pillActive]}>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.optionCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={Colors.light.tint} />
            <Text style={styles.optionText}>Choose from calendar</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.optionCard}>
            <Ionicons name="location-outline" size={18} color={Colors.light.tint} />
            <Text style={styles.optionText}>Brussels, Belgium</Text>
            <Ionicons name="chevron-forward" size={16} color="#8a7f77" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price range</Text>
            <Text style={styles.priceHint}>0 EUR - 120 EUR</Text>
          </View>

          <View style={styles.slider}>
            <View style={styles.sliderTrack} />
            <View style={styles.sliderRange} />
            <View style={[styles.sliderHandle, { left: '18%' }]}>
              <Text style={styles.handleLabel}>+</Text>
            </View>
            <View style={[styles.sliderHandle, { left: '68%' }]}>
              <Text style={styles.handleLabel}>+</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply filters</Text>
          </TouchableOpacity>
        </View>
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
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: '#1f1a17',
    fontSize: 26,
    fontWeight: '800',
  },
  heroCard: {
    backgroundColor: '#231b17',
    borderRadius: 24,
    padding: 18,
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    lineHeight: 21,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
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
  priceHint: { color: Colors.light.tint, fontWeight: '700' },
  slider: {
    height: 64,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e6ddd4',
    borderRadius: 999,
  },
  sliderRange: {
    position: 'absolute',
    left: '18%',
    right: '32%',
    height: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 999,
  },
  sliderHandle: {
    position: 'absolute',
    top: 11,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  handleLabel: { fontWeight: '800', color: Colors.light.tint },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  resetBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  resetText: { fontWeight: '700', color: '#6f655e' },
  applyBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '800' },
});
