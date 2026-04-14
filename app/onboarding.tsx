import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { LogoMark } from '@/components/logo-mark';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const highlights = [
  'Discover nights that actually match your mood',
  'Capture your drink moments and earn crowns',
  'Save favorite discovery presets for faster browsing',
];

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SurfaceCard style={styles.card}>
            <View style={styles.logoWrap}>
              <LogoMark size={52} />
            </View>

            <Text style={styles.eyebrow}>WELCOME TO EVENTCAPTURE</Text>
            <Text style={styles.title}>Find the night. Keep the memory.</Text>
            <Text style={styles.body}>
              EventCapture helps you discover events around Brussels, save the ones that match your vibe,
              and turn your best drink moments into a shared nightlife diary.
            </Text>

            <View style={styles.highlightList}>
              {highlights.map((item) => (
                <View key={item} style={styles.highlightRow}>
                  <View style={styles.highlightIcon}>
                    <Ionicons name="sparkles-outline" size={16} color={Colors.light.tint} />
                  </View>
                  <Text style={styles.highlightText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionBlock}>
              <AppButton label="Sign in" onPress={() => router.push('/auth/login')} />
              <AppButton label="Create account" variant="secondary" onPress={() => router.push('/profile/create')} />
            </View>
          </SurfaceCard>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1f1612' },
  background: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    borderRadius: 30,
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  logoWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#fce7d7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#8d6c56',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: '#1f1a17',
    fontSize: 31,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#6f655e',
    lineHeight: 22,
    textAlign: 'center',
  },
  highlightList: {
    gap: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff4e8',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  highlightIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  highlightText: {
    flex: 1,
    color: '#1f1a17',
    fontWeight: '700',
    lineHeight: 19,
  },
  actionBlock: {
    gap: 10,
    marginTop: 2,
  },
});
