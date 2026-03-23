import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const tags = ['Live music', 'Craft beer', 'Outdoor', 'Friends night'];

export default function EventDetailScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.heroWrap}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80',
            }}
            style={styles.hero}
            contentFit="cover"
          />

          <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(28,18,13,0.82)']} style={styles.heroOverlay}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="#fff7ef" />
              </TouchableOpacity>

              <View style={styles.topActions}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="heart-outline" size={18} color="#fff7ef" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="share-social-outline" size={18} color="#fff7ef" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>TRENDING TONIGHT</Text>
              </View>
              <Text style={styles.title}>Sunset Brewery Fest</Text>
              <Text style={styles.subtitle}>
                A warm open-air evening with craft beer, local music and one of the most social crowds in the city.
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="calendar-outline" size={14} color="#f6d6bb" />
                  <Text style={styles.metaText}>22 Oct</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="time-outline" size={14} color="#f6d6bb" />
                  <Text style={styles.metaText}>15:00 - 21:00</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="people-outline" size={14} color="#f6d6bb" />
                  <Text style={styles.metaText}>642 going</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>18 EUR</Text>
              <Text style={styles.statLabel}>pre-sale</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Ixelles</Text>
              <Text style={styles.statLabel}>location</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Open air</Text>
              <Text style={styles.statLabel}>experience</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>
              Join us for an evening of craft beers, live music and sunset energy that slowly builds into a buzzing night scene. Expect local brewers, food stands, good pacing and enough space to actually enjoy the event without feeling boxed in.
            </Text>

            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Event details</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="pin-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Brussels Beer Garden, Ixelles</Text>
                <Text style={styles.detailHint}>Tap to open in maps</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="calendar-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Date and time</Text>
                <Text style={styles.detailValue}>Wednesday 22 October 2026</Text>
                <Text style={styles.detailHint}>15:00 until 21:00</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="musical-notes-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Music & vibe</Text>
                <Text style={styles.detailValue}>Indie, electro and live sessions</Text>
                <Text style={styles.detailHint}>Relaxed social atmosphere</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <MaterialCommunityIcons name="currency-eur" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>Pricing</Text>
                <Text style={styles.detailValue}>18 EUR pre-sale</Text>
                <Text style={styles.detailHint}>22 EUR at the door</Text>
              </View>
            </View>
          </View>

          <View style={styles.hostCard}>
            <View style={styles.hostRow}>
              <Image source={{ uri: 'https://i.pravatar.cc/120?img=12' }} style={styles.hostAvatar} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.hostLabel}>Hosted by</Text>
                <Text style={styles.hostName}>Brussels Nights Collective</Text>
              </View>
              <TouchableOpacity style={styles.followBtn}>
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomWrap}>
        <View style={styles.bottomCard}>
          <View>
            <Text style={styles.bottomPrice}>18 EUR</Text>
            <Text style={styles.bottomPriceMeta}>per ticket</Text>
          </View>

          <TouchableOpacity style={styles.buyButton}>
            <LinearGradient colors={[Colors.light.tint, Colors.light.tintDark]} style={styles.buyGradient}>
              <Text style={styles.buyText}>Get ticket</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { paddingBottom: 132 },
  heroWrap: { height: 430, marginBottom: -26 },
  hero: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 42,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroContent: { gap: 12 },
  liveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#fff7ef', fontSize: 34, fontWeight: '800', lineHeight: 38, maxWidth: 300 },
  subtitle: { color: '#eadccf', fontSize: 15, lineHeight: 22, maxWidth: 320 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaText: { color: '#f6d6bb', fontWeight: '700', fontSize: 12.5 },
  body: { paddingHorizontal: 16, gap: 16 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statValue: { color: '#1f1a17', fontWeight: '800', fontSize: 18 },
  statLabel: { color: '#81776f', marginTop: 4, fontSize: 12.5 },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 26,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: { color: '#1f1a17', fontSize: 22, fontWeight: '800', marginBottom: 10 },
  description: { color: '#6f655e', lineHeight: 22, fontSize: 14.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  tag: { backgroundColor: '#f2e4d5', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  tagText: { color: '#4b4038', fontWeight: '700', fontSize: 12.5 },
  detailRow: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 12 },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f6efe6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: { flex: 1, gap: 2 },
  detailLabel: { color: '#7b7068', fontSize: 12.5, fontWeight: '700' },
  detailValue: { color: '#1f1a17', fontSize: 16, fontWeight: '800', lineHeight: 21 },
  detailHint: { color: '#8d8178', fontSize: 13 },
  hostCard: {
    backgroundColor: '#231b17',
    borderRadius: 24,
    padding: 16,
  },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatar: { width: 54, height: 54, borderRadius: 27 },
  hostLabel: { color: '#d4c4b7', fontSize: 12 },
  hostName: { color: '#fff7ef', fontSize: 17, fontWeight: '800', marginTop: 2 },
  followBtn: {
    backgroundColor: '#fff7ef',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  followText: { color: '#231b17', fontWeight: '800' },
  bottomWrap: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  bottomCard: {
    backgroundColor: 'rgba(255,250,245,0.98)',
    borderRadius: 24,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bottomPrice: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  bottomPriceMeta: { color: '#7b7068', marginTop: 2 },
  buyButton: { borderRadius: 18, overflow: 'hidden' },
  buyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buyText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
