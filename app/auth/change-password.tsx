import { AppButton } from '@/components/ui/app-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, isBusy } = useUser();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setSuccess('');
      setError(t('changePasswordMismatchError'));
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (!result.ok) {
      setSuccess('');
      setError(result.error ?? t('changePasswordFailedMessage'));
      return;
    }

    setError('');
    setSuccess(t('changePasswordSuccessInline'));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast({
      tone: 'success',
      title: t('changePasswordToastTitle'),
      message: t('changePasswordToastMessage'),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.container}>
          <ScreenHeader
            eyebrow={t('changePasswordEyebrow')}
            title={t('changePasswordTitle')}
            subtitle={t('changePasswordSubtitle')}
            onBack={() => router.back()}
          />

          <SurfaceCard style={styles.heroCard}>
            <Text style={styles.heroTitle}>{t('changePasswordHeroTitle')}</Text>
            <Text style={styles.heroText}>
              {t('changePasswordHeroText')}
            </Text>
          </SurfaceCard>

          <SurfaceCard style={styles.sectionCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('changePasswordCurrentLabel')}</Text>
              <TextInput
                placeholder={t('changePasswordCurrentPlaceholder')}
                placeholderTextColor="#91867f"
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('changePasswordNewLabel')}</Text>
              <TextInput
                placeholder={t('changePasswordNewPlaceholder')}
                placeholderTextColor="#91867f"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('changePasswordConfirmLabel')}</Text>
              <TextInput
                placeholder={t('changePasswordConfirmPlaceholder')}
                placeholderTextColor="#91867f"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}
          </SurfaceCard>

          <AppButton
            label={isBusy ? t('changePasswordSubmitBusy') : t('changePasswordSubmitButton')}
            onPress={() => void handleSave()}
            disabled={isBusy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 16, paddingBottom: 32, gap: 16 },
  heroCard: { backgroundColor: '#231b17', gap: 8 },
  heroTitle: { color: '#fff7ef', fontSize: 22, fontWeight: '800' },
  heroText: { color: '#d7c7bb', lineHeight: 21 },
  sectionCard: { gap: 14 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#81776f', fontWeight: '700', fontSize: 12.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  errorText: { color: '#c64d3a', fontWeight: '700' },
  successText: { color: '#0f766e', fontWeight: '700' },
});
