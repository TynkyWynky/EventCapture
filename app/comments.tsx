import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const comments = [
  { user: 'Username', text: 'Comment .................' },
  { user: 'Username', text: 'Comment .................' },
];

export default function CommentsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <Text style={styles.subtitle}>Username</Text>
        <TouchableOpacity style={styles.close}>
          <Ionicons name="close" size={18} color="#d9534f" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {comments.map((item, idx) => (
          <View key={idx} style={styles.commentCard}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.user}</Text>
              <View style={styles.bubble}>
                <Text style={styles.comment}>{item.text}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput placeholder="Add a comment ..." style={styles.input} placeholderTextColor="#777" />
        <TouchableOpacity style={styles.send}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
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
  commentCard: { flexDirection: 'row', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#d0d0d0' },
  name: { fontWeight: '700', marginBottom: 4, color: '#333' },
  bubble: {
    backgroundColor: '#ededed',
    borderRadius: 12,
    padding: 10,
  },
  comment: { color: '#555' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f68c1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
