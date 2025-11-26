import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function ContactScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>We’d love to hear from you!</Text>
          <Text style={styles.cardText}>
            Your feedback helps us improve BeerReal for everyone.
          </Text>
        </View>

        <Text style={styles.label}>Your message</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your feedback..."
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 14, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff4d8',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: { fontWeight: '800', color: '#222', marginBottom: 4 },
  cardText: { color: '#555' },
  label: { fontWeight: '700', color: '#222' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    height: 180,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#111',
  },
  submit: {
    marginTop: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
