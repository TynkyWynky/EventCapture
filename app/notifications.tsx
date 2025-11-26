import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const items = [
  { text: 'Joe liked your post', time: '2h ago', icon: 'heart' },
  { text: 'Jaime commented', time: '10h ago', icon: 'chatbubble-ellipses-outline' },
  { text: 'Jaime liked your post', time: '21/02/2025 10:25', icon: 'heart' },
  { text: 'Jeniffer liked your post', time: '15/10/2024 17:10', icon: 'heart' },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Notifications</Text>
        {items.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Ionicons
              name={item.icon as any}
              size={20}
              color={item.icon === 'heart' ? '#e74c3c' : '#555'}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 12, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 6 },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#d0d0d0' },
  text: { fontWeight: '700', color: '#222' },
  time: { color: '#777', fontSize: 12 },
});
