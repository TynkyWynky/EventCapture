import { AppButton } from '@/components/ui/app-button';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScreenHeader
          eyebrow={t('termsEyebrow')}
          title={t('termsTitle')}
          subtitle={t('termsSubtitle')}
          onBack={() => router.back()}
          mode="compact"
        />

        {agreed ? (
          <FeedbackBanner
            tone="success"
            title={t('termsBannerTitle')}
            message={t('termsBannerMsg')}
          />
        ) : null}

        <SurfaceCard style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>
              {t('termsBody')}
            </Text>
          </ScrollView>
        </SurfaceCard>

        <View style={styles.actions}>
          <AppButton label={t('termsBtnBack')} variant="secondary" style={styles.action} onPress={() => router.back()} />
          <AppButton label={agreed ? t('termsBtnAgreed') : t('termsBtnAgree')} style={styles.action} onPress={() => setAgreed(true)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, gap: Layout.sectionGap, flex: 1 },
  card: {
    flex: 1,
  },
  body: { ...Typography.body, color: '#514943' },
  actions: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  action: { flex: 1 },
});
