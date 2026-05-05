import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { LogoMark } from '@/components/logo-mark';
import { Colors, Radius, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetScreen() {
  const router = useRouter();
  const { user, requestPasswordReset, resetPassword, isBusy } = useUser();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState(user.email);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRequestReset = async () => {
    setIsRequesting(true);
    const result = await requestPasswordReset(email);
    setIsRequesting(false);

    if (!result.ok) {
      setSuccess('');
      setError(result.error ?? t('resetRequestFailedMessage'));
      return;
    }

    if (result.resetToken) {
      setResetToken(result.resetToken);
      setSuccess(t('resetDevTokenSuccess'));
    } else {
      setSuccess(t('resetEmailSentSuccess'));
    }
    setError('');
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setSuccess('');
      setError(t('resetMismatchError'));
      return;
    }

    if (!resetToken.trim()) {
      setSuccess('');
      setError(t('resetTokenRequiredError'));
      return;
    }

    setIsResetting(true);
    const result = await resetPassword(resetToken, newPassword);
    setIsResetting(false);

    if (!result.ok) {
      setSuccess('');
      setError(result.error ?? t('resetConfirmFailedMessage'));
      return;
    }

    setError('');
    setSuccess(t('resetSuccessMessage'));
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    showToast({
      tone: 'success',
      title: t('resetSuccessTitle'),
      message: t('resetSuccessMessage'),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <SurfaceCard style={styles.card}>
              <View style={styles.logoWrap}>
                <LogoMark size={48} />
              </View>

              <View style={styles.copy}>
                <Text style={styles.title}>{t('resetTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t('resetSubtitle')}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder={t('resetEmailPlaceholder')}
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <AppButton
                label={isRequesting ? t('resetRequestBusy') : t('resetRequestButton')}
                onPress={() => void handleRequestReset()}
                size="lg"
                disabled={isRequesting || isResetting || isBusy}
              />

              <View style={styles.inputRow}>
                <Ionicons name="key-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder={t('resetTokenPlaceholder')}
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  value={resetToken}
                  onChangeText={setResetToken}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder={t('resetNewPasswordPlaceholder')}
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder={t('resetConfirmPasswordPlaceholder')}
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {success ? <Text style={styles.successText}>{success}</Text> : null}

              <AppButton
                label={isResetting ? t('resetConfirmBusy') : t('resetConfirmButton')}
                onPress={() => void handleReset()}
                size="lg"
                disabled={isRequesting || isResetting || isBusy}
              />
              <AppButton
                label={t('resetBackButton')}
                variant="secondary"
                onPress={() => router.back()}
                disabled={isRequesting || isResetting || isBusy}
              />
            </SurfaceCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1f1612' },
  flex: { flex: 1 },
  background: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  card: {
    borderRadius: Radius.xxl,
    paddingHorizontal: 22,
    paddingVertical: 30,
    gap: 14,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignSelf: 'center',
    backgroundColor: '#fce7d7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  copy: { gap: 6 },
  title: { ...Typography.titleLg, color: Colors.light.title, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.light.subtitle, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  input: { flex: 1, color: '#1f1a17', fontWeight: '600' },
  errorText: { color: '#c64d3a', fontWeight: '700', textAlign: 'center' },
  successText: { color: '#0f766e', fontWeight: '700', textAlign: 'center' },
});
