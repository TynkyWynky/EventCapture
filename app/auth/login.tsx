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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    const result = await signIn(email, password);

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
                <Text style={styles.metaText}>Secure backend email and password sign-in</Text>
                <TouchableOpacity onPress={() => router.push('/auth/reset')}>
                  <Text style={styles.metaLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <AppButton label="Sign in" onPress={() => void handleSignIn()} size="lg" />
              <AppButton label="Create account" variant="secondary" onPress={() => router.push('/profile/create')} />
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
