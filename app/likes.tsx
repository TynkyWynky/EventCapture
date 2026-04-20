import { useEvents } from '@/context/EventContext';
import { useSocial } from '@/context/SocialContext';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';

import { Colors } from '@/constants/theme';

export default function LikesScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { getEventById } = useEvents();
  const { getEventSocial } = useSocial();
  const { t } = useLanguage();
  const event = getEventById(eventId);
  const users = getEventSocial(eventId)?.likes ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow={t('likesEyebrow')}
          title={t('likesTitle')}
          subtitle={event?.title ?? t('likesSubtitle')}
          onBack={() => router.back()}
          mode="compact"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {users.length ? (
          users.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{entry.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{entry.name}</Text>
                <Text style={styles.meta}>{t('likesUserLiked')}</Text>
              </View>
              <View style={styles.heartBadge}>
                <Ionicons name="heart" size={16} color="#e45b5b" />
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            icon="heart-outline"
            title={t('likesEmptyTitle')}
            message={t('likesEmptyMsg')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#1f1a17', fontWeight: '800' },
  name: { color: '#1f1a17', fontWeight: '800' },
  meta: { color: '#81776f', fontSize: 12.5, marginTop: 4 },
  heartBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fdeeed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
