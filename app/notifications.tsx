import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const items = [
  {
    user: 'Joe',
    text: 'liked your latest capture',
    time: '2h ago',
    icon: 'heart',
    color: '#e45b5b',
    section: 'New',
  },
  {
    user: 'Jaime',
    text: 'commented on your event post',
    time: '10h ago',
    icon: 'chatbubble-ellipses-outline',
    color: Colors.light.accent,
    section: 'New',
  },
  {
    user: 'Alex',
    text: 'saved Sunset Brewery Fest',
    time: 'Yesterday',
    icon: 'bookmark-outline',
    color: Colors.light.tint,
    section: 'Earlier',
  },
  {
    user: 'Jeniffer',
    text: 'liked your profile update',
    time: '15 Oct 2024',
    icon: 'heart',
    color: '#e45b5b',
    section: 'Earlier',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const sections = ['New', 'Earlier'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>ACTIVITY</Text>
            <Text style={styles.title}>Notifications</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="checkmark-done-outline" size={20} color="#1f1a17" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Stay in the loop</Text>
          <Text style={styles.heroText}>Track likes, comments and event activity without losing the thread of your night.</Text>
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
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
