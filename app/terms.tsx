import { AppButton } from '@/components/ui/app-button';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScreenHeader
          eyebrow="LEGAL"
          title="Terms & privacy"
          subtitle="A readable version of the basics people actually care about."
          onBack={() => router.back()}
        />

        {agreed ? (
          <FeedbackBanner
            tone="success"
            title="Preference saved"
            message="This mock flow now remembers that you agreed during this session."
          />
        ) : null}

        <SurfaceCard style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>
              These terms explain how EventCapture should be used respectfully and safely. By continuing to use the app,
              you agree to share accurate information, follow community standards, and avoid abusive, misleading or harmful content.
              {'\n\n'}
              We may use account activity, captures and event interactions to improve recommendations, personalize the experience,
              and keep the platform secure. You remain responsible for what you upload and for respecting the rules of the venues and events you attend.
              {'\n\n'}
              If you need clarification around privacy, account handling, or data requests, you can always reach out through support.
            </Text>
          </ScrollView>
        </SurfaceCard>

        <View style={styles.actions}>
          <AppButton label="Back" variant="secondary" style={styles.action} onPress={() => router.back()} />
          <AppButton label={agreed ? 'Agreed' : 'Agree'} style={styles.action} onPress={() => setAgreed(true)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 16, flex: 1 },
  card: {
    flex: 1,
  },
  body: { color: '#514943', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  action: { flex: 1 },
});
