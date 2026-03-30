import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const faqs = [
  { q: 'What is EventCapture?', a: 'EventCapture helps you discover events, capture moments and unlock rewards.' },
  { q: 'Do I need to be 18 to use the app?', a: 'Yes, the app is intended for users aged 18 and above.' },
  { q: 'How do I earn crowns?', a: 'Attend events, post captures and complete challenges linked to the event flow.' },
  { q: 'How do I create an event?', a: 'Open the create flow from the app and publish your event with all the key details.' },
];

export default function FAQScreen() {
  const [open, setOpen] = useState(0);
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
            <Text style={styles.title}>Help & FAQ</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Need help quickly?</Text>
          <Text style={styles.heroText}>Find the most common answers here before reaching out to support.</Text>
        </View>

        {faqs.map((item, idx) => {
          const active = open === idx;
          return (
            <TouchableOpacity key={item.q} style={styles.faqRow} onPress={() => setOpen(active ? -1 : idx)}>
              <View style={styles.faqTop}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={18} color="#6f655e" />
              </View>
              {active ? <Text style={styles.answer}>{item.a}</Text> : null}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.contact} onPress={() => router.push('/contact')}>
          <Text style={styles.contactText}>Still need help? Contact us</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 12, paddingBottom: 152 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
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
    marginBottom: 4,
  },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 22 },
  heroText: { color: '#d7c7bb', marginTop: 8, lineHeight: 21 },
  faqRow: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  faqTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: { flex: 1, color: '#1f1a17', fontWeight: '800', fontSize: 15 },
  answer: { color: '#6f655e', marginTop: 10, lineHeight: 20 },
  contact: {
    marginTop: 6,
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  contactText: { color: '#fff', fontWeight: '800' },
});
