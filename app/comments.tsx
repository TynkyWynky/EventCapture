import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const comments = [
  { user: 'Lina', text: 'This event looked so good, where was it exactly?', time: '2m ago' },
  { user: 'Niels', text: 'Love the vibe on this capture.', time: '16m ago' },
];

export default function CommentsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#1f1a17" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ENGAGEMENT</Text>
          <Text style={styles.title}>Comments</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {comments.map((item) => (
          <View key={`${item.user}-${item.time}`} style={styles.commentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.user}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.bubble}>
                <Text style={styles.comment}>{item.text}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput placeholder="Add a comment..." style={styles.input} placeholderTextColor="#8c827a" />
        <TouchableOpacity style={styles.send}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
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
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  commentCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 14,
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
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { color: '#1f1a17', fontWeight: '800' },
  time: { color: '#8c827a', fontSize: 12.5 },
  bubble: { backgroundColor: '#f6eee4', borderRadius: 16, padding: 12 },
  comment: { color: '#514943', lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: Colors.light.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#1f1a17',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
