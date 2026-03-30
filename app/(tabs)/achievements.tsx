import { AppButton } from '@/components/ui/app-button';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { usePosts } from '@/context/PostContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AchievementsScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const { crowns } = usePosts();
  const recentRewards = events.slice(0, 3).map((event, index) => ({
    title: event.title,
    date: event.fullDate,
    address: event.place,
    icon:
      index === 0
        ? 'medal-outline'
        : index === 1
          ? 'ribbon-outline'
          : 'trophy-outline',
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="REWARDS"
          title="Achievements"
          subtitle="Track your progress and your latest unlocks."
          onBack={() => router.back()}
          rightAction={
            <IconActionButton icon="notifications-outline" onPress={() => router.push('/notifications')} />
          }
        />

        <SurfaceCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <Ionicons name="medal-outline" size={22} color={Colors.light.tint} />
            </View>
            <View style={styles.progressCopy}>
              <Text style={styles.progressTitle}>Reward progress</Text>
              <Text style={styles.progressSubtitle}>Keep capturing events to unlock all 9 crowns.</Text>
            </View>
            <Text style={styles.progressCount}>{crowns}/9</Text>
          </View>

          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarFill, { width: `${Math.min((crowns / 9) * 100, 100)}%` }]} />
          </View>

          <View style={styles.progressStats}>
            <StatChip label="crowns" value={crowns.toString()} tone="accent" />
            <StatChip label="recent" value={recentRewards.length.toString()} />
          </View>
        </SurfaceCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unlocked at</Text>
          <Text style={styles.sectionMeta}>Recent rewards</Text>
        </View>

        {recentRewards.map((crown) => (
          <SurfaceCard key={crown.title} style={styles.crownCard}>
            <View style={styles.badge}>
              <Ionicons name={crown.icon as keyof typeof Ionicons.glyphMap} size={26} color={Colors.light.tint} />
            </View>

            <View style={styles.crownCopy}>
              <Text style={styles.crownTitle}>{crown.title}</Text>
              <Text style={styles.crownMeta}>{crown.date}</Text>
              <Text style={styles.crownMeta}>{crown.address}</Text>
            </View>
          </SurfaceCard>
        ))}

        <AppButton label="Capture another moment" onPress={() => router.push('/camera')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  progressCard: {
    backgroundColor: '#231b17',
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
  progressCopy: { flex: 1 },
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
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 999,
  },
  progressStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#857a72', fontWeight: '700' },
  crownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownCopy: { flex: 1 },
  crownTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 16 },
  crownMeta: { color: '#81776f', fontSize: 12.5, marginTop: 3 },
});
