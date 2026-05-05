import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { LogoMark } from '@/components/logo-mark';
import { Colors, Radius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';

const loopStepKeys = [
  ['loopFindTitle', 'loopFindBody', 'search-outline'],
  ['loopCaptureTitle', 'loopCaptureBody', 'camera-outline'],
  ['loopEarnTitle', 'loopEarnBody', 'ribbon-outline'],
  ['loopShareTitle', 'loopShareBody', 'chatbubble-ellipses-outline'],
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SurfaceCard style={styles.card}>
            <View style={styles.logoWrap}>
              <LogoMark size={52} />
            </View>

            <Text style={styles.eyebrow}>{t('landingBadge')}</Text>
            <Text style={styles.title}>{t('onboardingTitle')}</Text>
            <Text style={styles.body}>{t('onboardingSubtitle')}</Text>

            <View style={styles.highlightList}>
              {loopStepKeys.map(([titleKey, bodyKey, icon]) => (
                <View key={titleKey} style={styles.highlightRow}>
                  <View style={styles.highlightIcon}>
                    <Ionicons name={icon} size={16} color={Colors.light.tint} />
                  </View>
                  <View style={styles.highlightCopy}>
                    <Text style={styles.highlightTitle}>{t(titleKey)}</Text>
                    <Text style={styles.highlightText}>{t(bodyKey)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.actionBlock}>
              <AppButton label={t('onboardingPrimaryCta')} onPress={() => router.push('/auth/login')} size="lg" />
              <AppButton
                label={t('onboardingSecondaryCta')}
                variant="secondary"
                onPress={() => router.push('/profile/create')}
              />
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
    borderRadius: Radius.xxl,
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
  title: { ...Typography.titleLg, color: Colors.light.title, textAlign: 'center' },
  body: {
    ...Typography.body,
    color: '#6f655e',
    textAlign: 'center',
  },
  highlightList: {
    gap: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff4e8',
    borderRadius: Radius.lg,
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
    marginTop: 2,
  },
  highlightCopy: {
    flex: 1,
    gap: 2,
  },
  highlightTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    lineHeight: 19,
  },
  highlightText: {
    color: '#6f655e',
    lineHeight: 18,
    fontSize: 12.5,
  },
  actionBlock: {
    gap: 10,
    marginTop: 2,
  },
});
