import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const users = ['Emma', 'Lucas', 'Mila', 'Noah'];

export default function LikesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#1f1a17" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ENGAGEMENT</Text>
          <Text style={styles.title}>Likes</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {users.map((name) => (
          <View key={name} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.meta}>Liked your latest capture</Text>
            </View>
            <View style={styles.heartBadge}>
              <Ionicons name="heart" size={16} color="#e45b5b" />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
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
  eyebrow: { color: '#857a72', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#1f1a17', fontSize: 26, fontWeight: '800' },
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
