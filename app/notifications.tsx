import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { Colors } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAllRead } = useSocial();
  const { showToast } = useToast();
  const items = notifications.map((item, index) => ({
    ...item,
    section: index < 3 ? 'New' : 'Earlier',
  }));
  const sections = ['New', 'Earlier'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="ACTIVITY"
          title="Notifications"
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              markAllRead();
              showToast({ tone: 'success', title: 'All cleared', message: 'Notifications have been cleared.' });
            }}>
              <Ionicons name="checkmark-done-outline" size={20} color="#1f1a17" />
            </TouchableOpacity>
          }
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Stay in the loop</Text>
          <Text style={styles.heroText}>Track likes, comments and event activity without losing the thread of your night.</Text>
        </SurfaceCard>

        {!items.length ? (
          <EmptyState
            icon="notifications-outline"
            title="No activity yet"
            message="Likes, saves, and comments will appear here as soon as they happen."
          />
        ) : null}

        {sections.map((section) => {
          const entries = items.filter((item) => item.section === section);
          if (!entries.length) return null;

          return (
            <View key={section} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section}</Text>

              {entries.map((item, idx) => (
                <TouchableOpacity key={`${section}-${idx}`} activeOpacity={0.92} style={styles.card}>
                  <View style={[styles.avatar, { backgroundColor: item.color }]}>
                    <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
                  </View>

                  <View style={styles.copy}>
                    <Text style={styles.text}>
                      <Text style={styles.user}>{item.user}</Text>
                      <Text> {item.text}</Text>
                    </Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>

                  <View style={[styles.iconBadge, { backgroundColor: `${item.color}18` }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152 },
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
  heroCard: {
    backgroundColor: '#231b17',
    marginBottom: 20,
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
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#857a72',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  copy: {
    flex: 1,
  },
  text: {
    color: '#3a322d',
    lineHeight: 20,
  },
  user: {
    fontWeight: '800',
    color: '#1f1a17',
  },
  time: {
    color: '#8c827a',
    fontSize: 12.5,
    marginTop: 4,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
