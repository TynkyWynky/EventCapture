import { AppButton } from '@/components/ui/app-button';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useEvents } from '@/context/EventContext';
import { usePosts } from '@/context/PostContext';
import { useUser } from '@/context/UserContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { posts, crowns } = usePosts();
  const { events } = useEvents();
  const { user } = useUser();
  const rewardProgress = Math.min((crowns / 9) * 100, 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <LinearGradient colors={['#231b17', '#4b2d1f']} style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.profileWrap}>
              <Image source={{ uri: user.avatarUri }} style={styles.avatar} />
              <View style={styles.identity}>
                <Text style={styles.name}>{user.username}</Text>
                <Text style={styles.sub}>
                  {user.fullName} · {user.city}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <IconActionButton icon="notifications-outline" tone="dark" onPress={() => router.push('/notifications')} />
              <IconActionButton icon="menu" tone="dark" onPress={() => router.push('/menu')} />
            </View>
          </View>

          <Text style={styles.bio}>{user.bio}</Text>

          <View style={styles.statsRow}>
            <StatChip label="posts" value={posts.length.toString()} tone="dark" />
            <StatChip label="crowns" value={crowns.toString()} tone="dark" />
            <StatChip label="events" value={events.length.toString()} tone="dark" />
          </View>

          <AppButton label="Edit profile" onPress={() => router.push('/profile/edit')} style={styles.editButton} />
        </LinearGradient>

        <SurfaceCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reward progress</Text>
            <Text style={styles.sectionMeta}>{crowns}/9</Text>
          </View>

          <View style={styles.progressOuter}>
            <View style={[styles.progressFill, { width: `${rewardProgress}%` }]} />
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

          <AppButton label="See all rewards" variant="secondary" onPress={() => router.push('/achievements')} />
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account snapshot</Text>
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons name="mail-outline" size={18} color={Colors.light.tint} />
            </View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons name="location-outline" size={18} color={Colors.light.tint} />
            </View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountLabel}>City</Text>
              <Text style={styles.accountValue}>{user.city}</Text>
            </View>
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{user.bio}</Text>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 18 },
  headerCard: {
    borderRadius: 28,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  headerTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  profileWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  identity: { flex: 1 },
  name: { color: '#fff7ef', fontWeight: '800', fontSize: 24 },
  sub: { color: '#decfc2', marginTop: 4 },
  bio: { color: '#decfc2', lineHeight: 21 },
  headerActions: { gap: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  editButton: { marginTop: 2 },
  sectionCard: { gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 20 },
  sectionMeta: { color: '#8a7f77', fontWeight: '700' },
  progressOuter: { height: 10, backgroundColor: '#efe3d5', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.light.tint, borderRadius: 999 },
  crownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  crownBadge: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#f4ece3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEarned: { backgroundColor: '#fff0de' },
  accountRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCopy: { flex: 1, gap: 2 },
  accountLabel: { color: '#7b7068', fontSize: 12.5, fontWeight: '700' },
  accountValue: { color: '#1f1a17', fontSize: 15, fontWeight: '700' },
  aboutText: { color: '#81776f', lineHeight: 22 },
});
