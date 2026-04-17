import { AppButton } from '@/components/ui/app-button';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const { t } = useLanguage();

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      setStatus('error');
      return;
    }

    setStatus('success');
    setSubject('');
    setMessage('');
    showToast({
      tone: 'success',
      title: t('contactToastTitle'),
      message: t('contactToastMsg'),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('contactEyebrow')}
          title={t('contactTitle')}
          subtitle={t('contactSubtitle')}
          onBack={() => router.back()}
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('contactHeroTitle')}</Text>
          <Text style={styles.heroText}>
            {t('contactHeroText')}
          </Text>
        </SurfaceCard>

        {status === 'error' ? (
          <FeedbackBanner
            tone="error"
            title={t('contactErrTitle')}
            message={t('contactErrMsg')}
          />
        ) : null}

        {status === 'success' ? (
          <FeedbackBanner
            tone="success"
            title={t('contactSuccTitle')}
            message={t('contactSuccMsg')}
          />
        ) : null}

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.label}>{t('contactLblSubj')}</Text>
          <TextInput
            style={styles.singleInput}
            placeholder={t('contactPlhSubj')}
            placeholderTextColor="#91867f"
            value={subject}
            onChangeText={setSubject}
          />

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

          <AppButton label={t('contactBtn')} onPress={handleSend} />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 16, paddingBottom: 152 },
  heroCard: {
    backgroundColor: '#231b17',
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    marginTop: 8,
    lineHeight: 21,
  },
  sectionCard: {
    gap: 12,
  },
  label: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 16,
  },
  singleInput: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    minHeight: 180,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
});
