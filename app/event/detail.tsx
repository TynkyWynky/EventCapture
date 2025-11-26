import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function EventDetailScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Image source={{ uri: 'https://i.pravatar.cc/120?img=64' }} style={styles.avatar} />
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/menu')}>
            <Ionicons name="menu" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
          }}
          style={styles.hero}
          contentFit="cover"
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Sunset Brewery Fest</Text>
            <Ionicons name="bookmark" size={22} color={Colors.light.tint} />
          </View>
          <Text style={styles.desc}>
            Description: Join us for an evening of craft beers and live music...
          </Text>

          <View style={styles.info}>
            <View style={styles.infoRow}>
              <Ionicons name="pin-outline" size={18} color="#555" />
              <Text style={styles.infoText}>Elsene</Text>
              <Text style={styles.infoHint}>Tap to open in maps</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#555" />
              <Text style={styles.infoText}>22/10/2025 15:00-21:00</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="musical-notes-outline" size={18} color="#555" />
              <Text style={styles.infoText}>Country, Metal</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="currency-eur" size={18} color="#555" />
              <Text style={styles.infoText}>120</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyText}>BUY TICKET</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { paddingBottom: 80 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
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
  hero: { width: '100%', height: 220, borderRadius: 0 },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: '#222' },
  desc: { color: '#555', marginTop: 8, marginBottom: 14, lineHeight: 20 },
  info: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontWeight: '700', color: '#444' },
  infoHint: { color: '#777' },
  buyButton: {
    marginTop: 22,
    backgroundColor: '#1c9dea',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  buyText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
});
