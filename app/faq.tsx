import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const faqs = [
  { q: 'What is BeerReal?', a: 'BeerReal helps you discover events and earn crowns.' },
  { q: 'Do I need to be 18 to use BeerReal?', a: 'Yes, BeerReal is for users 18+.' },
  { q: 'How do I earn crowns?', a: 'Attend events, post selfies with drinks, and complete challenges.' },
  { q: 'How do I create an event?', a: 'Use the Create Event screen to add your own events.' },
];

export default function FAQScreen() {
  const [open, setOpen] = useState(0);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Need Help?</Text>
          <Text style={styles.cardText}>
            Find answers to common questions about BeerReal. If you can&apos;t find what you&apos;re
            looking for, feel free to contact us through the Feedback section.
          </Text>
        </View>

        {faqs.map((item, idx) => {
          const active = open === idx;
          return (
            <TouchableOpacity
              key={item.q}
              style={styles.faqRow}
              onPress={() => setOpen(active ? -1 : idx)}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={18} color="#555" />
              {active && <Text style={styles.answer}>{item.a}</Text>}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.contact}>
          <Text style={styles.contactText}>Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 12, paddingBottom: 120 },
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
  cardTitle: { fontWeight: '800', color: '#111', marginBottom: 4 },
  cardText: { color: '#555' },
  faqRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 4,
  },
  faqQuestion: { fontWeight: '700', color: '#222', marginBottom: 6 },
  answer: { color: '#555', marginTop: 8, lineHeight: 18 },
  contact: {
    marginTop: 8,
    backgroundColor: '#f68c1f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  contactText: { color: '#fff', fontWeight: '800' },
});
