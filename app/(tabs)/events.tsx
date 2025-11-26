import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const avatar = 'https://i.pravatar.cc/120?img=64';

const placeholders = Array.from({ length: 6 }).map((_, i) => ({
  title: `Event name`,
  key: `event-${i}`,
}));

export default function MyEventsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <Text style={styles.title}>My Events</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/menu')}>
              <Ionicons name="menu" size={22} color="#111" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          {placeholders.map(card => (
            <View key={card.key} style={styles.card}>
              <View style={styles.box} />
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { padding: 16, paddingBottom: 120 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  title: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111' },
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    width: '47%',
    backgroundColor: '#f4f4f4',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  box: { height: 90, backgroundColor: '#dcdcdc', borderRadius: 10 },
  cardTitle: { marginTop: 8, fontWeight: '600', color: '#444', fontSize: 13 },
});
