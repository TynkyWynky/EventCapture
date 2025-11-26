import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

const genres = ['Jazz', 'Country', 'Metal'];

export default function FiltersScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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

        <View style={styles.section}>
          <Text style={styles.label}>Time & Date</Text>
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
          <TouchableOpacity style={styles.calendar}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color="#5b6bff" />
            <Text style={styles.calendarText}>Choose from calendar</Text>
            <Ionicons name="chevron-forward" size={16} color="#5b6bff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity style={styles.location}>
            <Ionicons name="location-outline" size={18} color="#5b6bff" />
            <Text style={styles.locationText}>Brussels, Belgium</Text>
            <Ionicons name="chevron-forward" size={16} color="#777" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select price range</Text>
          <Text style={styles.priceHint}>€0–€120</Text>
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
            <Text style={styles.resetText}>RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyText}>APPLY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { padding: 16, gap: 14 },
  chipRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  genreChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  genreChipActive: {
    backgroundColor: '#6c63ff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  genreText: { color: '#555', fontWeight: '600' },
  genreTextActive: { color: '#fff' },
  section: { gap: 10 },
  label: { fontWeight: '700', color: '#222', fontSize: 15 },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
  },
  pillActive: { backgroundColor: '#e6e9ff', borderWidth: 1, borderColor: '#6c63ff' },
  pillText: { color: '#555', fontWeight: '600' },
  pillTextActive: { color: '#6c63ff' },
  calendar: {
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarText: { color: '#5b6bff', fontWeight: '700', flex: 1 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  locationText: { flex: 1, color: '#333', fontWeight: '700' },
  slider: {
    height: 60,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e6e6e6',
    borderRadius: 999,
  },
  sliderRange: {
    position: 'absolute',
    left: '18%',
    right: '32%',
    height: 6,
    backgroundColor: '#6c63ff',
    borderRadius: 999,
  },
  sliderHandle: {
    position: 'absolute',
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  handleLabel: { fontWeight: '800', color: '#6c63ff' },
  priceHint: { alignSelf: 'flex-end', color: '#5b6bff', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  resetText: { fontWeight: '700', color: '#555' },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6c63ff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  applyText: { color: '#fff', fontWeight: '800' },
});
