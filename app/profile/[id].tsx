import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Typography } from '@/constants/theme';
import { fetchPublicProfile, PublicProfile } from '@/services/publicProfileApi';

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [profile, setProfile] = React.useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!id) {
        if (isMounted) {
          setError('Profile not found.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const nextProfile = await fetchPublicProfile(id);
        if (!isMounted) {
          return;
        }
        setProfile(nextProfile);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this profile.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="Public profile"
          title={profile?.full_name || profile?.username || 'Profile'}
          subtitle={profile ? `@${profile.username}` : 'View public details'}
          onBack={() => router.back()}
          mode="compact"
        />

        {isLoading ? (
          <SurfaceCard style={styles.loadingCard}>
            <ActivityIndicator color={Colors.light.tint} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </SurfaceCard>
        ) : null}

        {error && !isLoading ? <FeedbackBanner tone="error" title="Profile unavailable" message={error} /> : null}

        {!isLoading && !error && !profile ? (
          <EmptyState icon="person-outline" title="Profile not found" message="This user is not available right now." />
        ) : null}

        {!isLoading && !error && profile ? (
          <SurfaceCard style={styles.profileCard}>
            {profile.avatar_uri ? (
              <AppImage source={{ uri: profile.avatar_uri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={34} color="#9a8d84" />
              </View>
            )}

            <View style={styles.copy}>
              <Text style={styles.name}>{profile.full_name || profile.username}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              <Text style={styles.bio}>{profile.bio?.trim() || 'No bio yet.'}</Text>
            </View>
          </SurfaceCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: 16 },
  loadingCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 26,
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
  },
  profileCard: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 28,
    paddingHorizontal: 22,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#f2ece6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#1f1a17',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  username: {
    color: Colors.light.tint,
    fontWeight: '700',
  },
  bio: {
    ...Typography.body,
    color: '#5e5550',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginTop: 6,
  },
});
