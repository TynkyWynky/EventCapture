import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { LogoMark } from '@/components/logo-mark';
import { Colors } from '@/constants/theme';
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
  const { user, resetPassword } = useUser();
  const { showToast } = useToast();
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = () => {
    if (newPassword !== confirmPassword) {
      setSuccess('');
      setError('New password and confirmation do not match.');
      return;
    }

    const result = resetPassword(email, newPassword);

    if (!result.ok) {
      setSuccess('');
      setError(result.error ?? 'Unable to reset password.');
      return;
    }

    setError('');
    setSuccess('Password reset successfully. You can now sign in.');
    setNewPassword('');
    setConfirmPassword('');
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

              <AppButton label="Reset password" onPress={handleReset} />
              <AppButton label="Back to login" variant="secondary" onPress={() => router.back()} />
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
    borderRadius: 30,
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
  title: { color: '#1f1a17', fontWeight: '800', fontSize: 30, textAlign: 'center' },
  subtitle: { color: '#7d726a', textAlign: 'center', lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  input: { flex: 1, color: '#1f1a17', fontWeight: '600' },
  errorText: { color: '#c64d3a', fontWeight: '700', textAlign: 'center' },
  successText: { color: '#0f766e', fontWeight: '700', textAlign: 'center' },
});
