import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { Colors, Radius } from '@/constants/theme';

const loopStepKeys = [
  ['loopFindTitle', 'loopFindBody'],
  ['loopCaptureTitle', 'loopCaptureBody'],
  ['loopEarnTitle', 'loopEarnBody'],
  ['loopShareTitle', 'loopShareBody'],
] as const;

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1f1612', '#432616', Colors.light.tintDark]} style={styles.background}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('landingBadge')}</Text>
          </View>

          <Text style={styles.title}>{t('landingTitle')}</Text>
          <Text style={styles.subtitle}>{t('landingSubtitle')}</Text>

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
                <Text style={styles.cardTitle}>{t('onboardingTitle')}</Text>
                <Text style={styles.cardText}>{t('onboardingSubtitle')}</Text>
              </View>
            </View>

            <View style={styles.loopList}>
              {loopStepKeys.map(([titleKey, bodyKey], index) => (
                <View key={titleKey} style={styles.loopRow}>
                  <View style={styles.loopIndex}>
                    <Text style={styles.loopIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.loopCopy}>
                    <Text style={styles.loopTitle}>{t(titleKey)}</Text>
                    <Text style={styles.loopBody}>{t(bodyKey)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('landingPrimaryCta')}
              style={styles.button}
              activeOpacity={0.9}
              onPress={() => router.push(isAuthenticated ? '/(tabs)' : '/onboarding')}>
              <Text style={styles.buttonText}>{t('landingPrimaryCta')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('landingSecondaryCta')}
              style={styles.secondaryButton}
              activeOpacity={0.82}
              onPress={() => router.push('/onboarding')}>
              <Text style={styles.secondaryButtonText}>{t('landingSecondaryCta')}</Text>
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
  badgeText: { color: '#f7e4d6', fontWeight: '800', fontSize: 11, letterSpacing: 1.1 },
  title: { color: '#fff8f2', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: '#edd8ca', fontSize: 15, lineHeight: 23, maxWidth: 340 },
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
  cardTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 20, lineHeight: 24 },
  cardText: { color: '#766b64', lineHeight: 20 },
  loopList: { gap: 12 },
  loopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: '#f6eee4',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loopIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loopIndexText: { color: Colors.light.tint, fontWeight: '800', fontSize: 12 },
  loopCopy: { flex: 1, gap: 2 },
  loopTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 14 },
  loopBody: { color: '#766b64', fontSize: 12.5, lineHeight: 18 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ead7c2',
  },
  secondaryButtonText: { color: '#5b4f48', fontWeight: '700', fontSize: 14 },
});
