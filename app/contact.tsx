import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function ContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SUPPORT</Text>
            <Text style={styles.title}>Contact</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>We'd love to hear from you</Text>
          <Text style={styles.heroText}>Questions, bug reports or feedback about the experience all belong here.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.label}>Your message</Text>
          <TextInput
            style={styles.input}
            placeholder="Tell us what happened, what you need, or what we can improve."
            placeholderTextColor="#91867f"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submit}>
            <Text style={styles.submitText}>Send message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 16, paddingBottom: 152 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    marginTop: 8,
    lineHeight: 21,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 18,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    minHeight: 180,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  submit: {
    marginTop: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
