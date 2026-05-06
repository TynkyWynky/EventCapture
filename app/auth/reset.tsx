import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { LogoMark } from '@/components/logo-mark';
import { Colors, Radius, Typography } from '@/constants/theme';
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
  const { user, requestPasswordReset, confirmPasswordReset } = useUser();
  const { showToast } = useToast();
  const [email, setEmail] = useState(user.email);
  const [challengeId, setChallengeId] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleRequestReset = async () => {
    setIsRequesting(true);
    const result = await requestPasswordReset(email);
    setIsRequesting(false);

    if (!result.ok) {
      setSuccess('');
      setError(result.error ?? 'Unable to request a reset code.');
      return;
    }

    setError('');
    setChallengeId(result.challengeId ?? '');
    setDebugCode(result.debugCode ?? '');
    setResetCode(result.debugCode ?? '');
    setSuccess(result.message ?? 'Reset instructions were sent.');
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setSuccess('');
      setError('New password and confirmation do not match.');
      return;
    }

    if (!challengeId.trim()) {
      setSuccess('');
      setError('Request a reset code first.');
      return;
    }

    setIsConfirming(true);
    const result = await confirmPasswordReset(challengeId, resetCode, newPassword);
    setIsConfirming(false);

    if (!result.ok) {
      setSuccess('');
      setError(result.error ?? 'Unable to reset password.');
      return;
    }

    setError('');
    setSuccess('Password reset successfully. You can now sign in.');
    setNewPassword('');
    setConfirmPassword('');
    setResetCode('');
    showToast({
      tone: 'success',
      title: 'Password reset',
      message: 'You can sign in again with the new password.',
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
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter your email and choose a new password to get back into your account.
                </Text>
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder="demo@eventcapture.app"
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <AppButton
                label={isRequesting ? 'Sending reset code...' : 'Send reset code'}
                onPress={() => void handleRequestReset()}
                size="lg"
                disabled={isRequesting}
              />

              {challengeId ? (
                <View style={styles.challengeCard}>
                  <Text style={styles.challengeTitle}>Reset challenge ready</Text>
                  <Text style={styles.challengeText}>
                    {debugCode
                      ? `Use code ${debugCode} for local testing or enter the code sent to email.`
                      : 'Enter the code from your email to confirm the password reset.'}
                  </Text>
                </View>
              ) : null}

              <View style={styles.inputRow}>
                <Ionicons name="key-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder="Reset code"
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  value={resetCode}
                  onChangeText={setResetCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#81776f" />
                <TextInput
                  placeholder="New password"
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
                  placeholder="Confirm new password"
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
                label={isConfirming ? 'Resetting password...' : 'Reset password'}
                onPress={() => void handleReset()}
                size="lg"
                disabled={isConfirming || !challengeId.trim()}
              />
              <AppButton
                label="Back to login"
                variant="secondary"
                onPress={() => router.back()}
                disabled={isConfirming || isRequesting}
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
  challengeCard: {
    backgroundColor: '#fff5ea',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#eed7bd',
    padding: 14,
    gap: 6,
  },
  challengeTitle: { color: '#7b4b22', fontWeight: '800' },
  challengeText: { color: '#7b5f48', lineHeight: 20 },
  errorText: { color: '#c64d3a', fontWeight: '700', textAlign: 'center' },
  successText: { color: '#0f766e', fontWeight: '700', textAlign: 'center' },
});
