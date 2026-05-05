import { AppButton } from '@/components/ui/app-button';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import { submitSupportContact } from '@/services/supportApi';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSupportContact({
        subject: subject.trim(),
        message: message.trim(),
        email: user.email,
      });
      setStatus('success');
      setSubject('');
      setMessage('');
      showToast({
        tone: 'success',
        title: t('contactToastTitle'),
        message: t('contactToastMsg'),
      });
    } catch (error) {
      setStatus('error');
      showToast({
        tone: 'error',
        title: t('contactErrTitle'),
        message: error instanceof Error ? error.message : t('contactErrMsg'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            eyebrow={t('contactEyebrow')}
            title={t('contactTitle')}
            subtitle={t('contactSubtitle')}
            onBack={() => router.back()}
            mode="compact"
          />

          <SurfaceCard style={styles.utilityCard} variant="subtle">
            <Text style={styles.utilityTitle}>{t('contactHeroTitle')}</Text>
            <Text style={styles.utilityText}>{t('contactHeroText')}</Text>
          </SurfaceCard>

          {status === 'error' ? (
            <FeedbackBanner tone="error" title={t('contactErrTitle')} message={t('contactErrMsg')} />
          ) : null}

          {status === 'success' ? (
            <FeedbackBanner tone="success" title={t('contactSuccTitle')} message={t('contactSuccMsg')} />
          ) : null}

          <SurfaceCard style={styles.sectionCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('contactLblSubj')}</Text>
              <TextInput
                style={styles.singleInput}
                placeholder={t('contactPlhSubj')}
                placeholderTextColor="#91867f"
                value={subject}
                onChangeText={setSubject}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('contactLblMsg')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('contactPlhMsg')}
                placeholderTextColor="#91867f"
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <AppButton
              label={isSubmitting ? t('contactBtnSending') : t('contactBtn')}
              onPress={() => void handleSend()}
              disabled={isSubmitting}
            />
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  container: { padding: Layout.screenPadding, gap: Layout.sectionGap, paddingBottom: Layout.bottomPad },
  utilityCard: { gap: 8 },
  utilityTitle: {
    ...Typography.titleSm,
    color: Colors.light.title,
  },
  utilityText: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
  },
  sectionCard: {
    gap: 16,
  },
  inputGroup: { gap: 8 },
  label: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 16,
  },
  singleInput: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    minHeight: 180,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
});
