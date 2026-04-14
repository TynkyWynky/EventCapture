import { AppButton } from '@/components/ui/app-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  { q: 'What is EventCapture?', a: 'EventCapture helps you discover events, capture moments, save discovery presets, and unlock rewards tied to your nightlife activity.' },
  { q: 'Do I need to be 18 to use the app?', a: 'Yes. The concept is designed for adult nightlife and drink-related event experiences.' },
  { q: 'How do I earn crowns?', a: 'Crowns are linked to eligible captures, event participation, and the reward flow that runs through the app.' },
  { q: 'How do I create an event?', a: 'Use the create flow in the app, add the event details and cover image, then publish it into the shared event feed.' },
];

export default function FAQScreen() {
  const [open, setOpen] = useState(0);
  const router = useRouter();

  const handleToggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === idx ? -1 : idx);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="SUPPORT"
          title="Help & FAQ"
          subtitle="The fastest answers for the questions people usually ask first."
          onBack={() => router.back()}
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Need help quickly?</Text>
          <Text style={styles.heroText}>Start here before reaching out to support. Most product basics and account questions are covered below.</Text>
        </SurfaceCard>

        {faqs.map((item, idx) => {
          const active = open === idx;
          return (
            <TouchableOpacity key={item.q} activeOpacity={0.92} onPress={() => handleToggle(idx)}>
              <SurfaceCard style={[styles.faqRow, active && styles.faqRowActive]}>
                <View style={styles.faqTop}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Ionicons name={active ? 'remove' : 'add'} size={18} color="#6f655e" />
                </View>
                {active ? <Text style={styles.answer}>{item.a}</Text> : null}
              </SurfaceCard>
            </TouchableOpacity>
          );
        })}

        <AppButton label="Still need help? Contact us" onPress={() => router.push('/contact')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 12, paddingBottom: 152 },
  heroCard: {
    backgroundColor: '#231b17',
  },
  heroTitle: { color: '#fff7ef', fontWeight: '800', fontSize: 22 },
  heroText: { color: '#d7c7bb', marginTop: 8, lineHeight: 21 },
  faqRow: {
    gap: 10,
  },
  faqRowActive: {
    borderWidth: 1,
    borderColor: '#f0caa9',
  },
  faqTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: { flex: 1, color: '#1f1a17', fontWeight: '800', fontSize: 15 },
  answer: { color: '#6f655e', lineHeight: 20 },
});
