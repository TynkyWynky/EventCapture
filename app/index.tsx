import { useUser } from '@/context/UserContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useUser();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1f1612', '#432616', Colors.light.tintDark]} style={styles.background}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CAPTURE THE NIGHT</Text>
          </View>

          <Text style={styles.title}>EventCapture</Text>
          <Text style={styles.subtitle}>
            Discover standout events, save the best moments and keep your whole night in one place.
          </Text>

          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('@/assets/images/splash-icon.png')}
                  style={styles.logo}
                  contentFit="contain"
                  transition={150}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>Tonight in Brussels</Text>
                <Text style={styles.cardText}>24 live events, 8 friends out, 1 place to keep track.</Text>
              </View>
            </View>

            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>24</Text>
                <Text style={styles.metricLabel}>events nearby</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>08</Text>
                <Text style={styles.metricLabel}>friends active</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.9}
              onPress={() => router.push(isAuthenticated ? '/(tabs)' : '/auth/login')}>
              <Text style={styles.buttonText}>Open EventCapture</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1f1612' },
  background: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glowOne: {
    position: 'absolute',
    top: 90,
    left: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowTwo: {
    position: 'absolute',
    right: -30,
    bottom: 160,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244,123,32,0.18)',
  },
  hero: { width: '88%', gap: 18 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: { color: '#f7e4d6', fontWeight: '800', fontSize: 12, letterSpacing: 1.2 },
  title: { color: '#fff8f2', fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: '#edd8ca', fontSize: 16, lineHeight: 24, maxWidth: 320 },
  card: {
    marginTop: 8,
    backgroundColor: '#fffaf5',
    borderRadius: 28,
    padding: 22,
    gap: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#fce7d7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 52, height: 52, borderRadius: 14 },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 21 },
  cardText: { color: '#766b64', lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, backgroundColor: '#f6eee4', borderRadius: 20, padding: 16 },
  metricValue: { color: '#1f1a17', fontWeight: '800', fontSize: 28 },
  metricLabel: { color: '#766b64', marginTop: 4, fontSize: 12.5 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
