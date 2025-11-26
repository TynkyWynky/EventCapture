import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const users = ['Username', 'Username', 'Username', 'Username'];

export default function LikesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Likes</Text>
        <Text style={styles.subtitle}>Username</Text>
        <TouchableOpacity style={styles.close}>
          <Ionicons name="close" size={18} color="#d9534f" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {users.map((name, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.avatar} />
            <Text style={styles.name}>{name}</Text>
            <Ionicons name="heart" size={18} color="#e74c3c" />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 12,
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  subtitle: { color: '#666', marginTop: 2 },
  close: { position: 'absolute', right: 12, top: 12 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#d0d0d0' },
  name: { flex: 1, fontWeight: '700', color: '#333' },
});
