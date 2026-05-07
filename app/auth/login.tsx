import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { LogoMark } from '@/components/logo-mark';
import { Colors, Radius, Typography } from '@/constants/theme';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user } = useUser();
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('eventcapture123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'Sign in failed.');
      return;
    }

    setError('');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <SurfaceCard style={styles.panel}>
              <View style={styles.logoWrap}>
                <LogoMark size={56} />
              </View>

              <View style={styles.copy}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Sign in to keep capturing events and moments that matter.
                </Text>
              </View>

              <View style={styles.accountRow}>
                <TouchableOpacity
                  style={[styles.demoCard, email === 'demo@eventcapture.app' && styles.demoCardActive]}
                  activeOpacity={0.85}
                  onPress={() => { setEmail('demo@eventcapture.app'); setPassword('eventcapture123'); setError(''); }}>
                  <Text style={styles.demoLabel}>Demo account</Text>
                  <Text style={styles.demoValue}>demo@eventcapture.app</Text>
                  <Text style={styles.demoHint}>Tap to fill</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoCard, email === 'admin@eventcapture.app' && styles.demoCardActive]}
                  activeOpacity={0.85}
                  onPress={() => { setEmail('admin@eventcapture.app'); setPassword('admin'); setError(''); }}>
                  <Text style={styles.demoLabel}>Admin</Text>
                  <Text style={styles.demoValue}>admin@eventcapture.app</Text>
                  <Text style={styles.demoHint}>Tap to fill</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#81776f" />
                <TextInput
                  value={email}
                  placeholder="Email"
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#81776f" />
                <TextInput
                  value={password}
                  placeholder="Password"
                  placeholderTextColor="#9a9189"
                  style={styles.input}
                  secureTextEntry
                  onChangeText={setPassword}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Backend account sign-in</Text>
                <TouchableOpacity onPress={() => router.push('/auth/reset')}>
                  <Text style={styles.metaLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <AppButton
                label={isSubmitting ? 'Signing in...' : 'Sign in'}
                onPress={() => void handleSignIn()}
                size="lg"
                disabled={isSubmitting}
              />
              <AppButton
                label="Create account"
                variant="secondary"
                onPress={() => router.push('/profile/create')}
                disabled={isSubmitting}
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
  panel: {
    borderRadius: Radius.xxl,
    paddingHorizontal: 22,
    paddingVertical: 30,
    gap: 14,
  },
  logoWrap: {
    width: 74,
    height: 74,
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
  accountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoCard: {
    flex: 1,
    backgroundColor: '#fff2e6',
    borderRadius: Radius.lg,
    padding: 14,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  demoCardActive: {
    borderColor: Colors.light.tint,
    backgroundColor: '#fff8f0',
  },
  demoLabel: { color: '#8a6a52', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  demoValue: { color: '#1f1a17', fontWeight: '800' },
  demoHint: { color: '#7d726a', fontSize: 12.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ead7c2',
  },
  input: { flex: 1, color: '#1f1a17', fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  metaText: { ...Typography.caption, color: '#8d827a', flex: 1 },
  metaLink: { ...Typography.caption, color: Colors.light.tint, fontWeight: '700' },
  errorText: { color: '#c64d3a', fontWeight: '700', textAlign: 'center' },
});
