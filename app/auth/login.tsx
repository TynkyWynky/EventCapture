import React from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/theme';
import { LogoMark } from '@/components/logo-mark';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <View style={styles.panel}>
          <View style={styles.logoWrap}>
            <LogoMark size={56} />
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to keep capturing events and moments that matter.</Text>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#81776f" />
            <TextInput
              defaultValue="demo@eventcapture.app"
              placeholder="Email"
              placeholderTextColor="#9a9189"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#81776f" />
            <TextInput
              defaultValue="eventcapture123"
              placeholder="Password"
              placeholderTextColor="#9a9189"
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Test login available</Text>
            <TouchableOpacity onPress={() => router.push('/auth/reset')}>
              <Text style={styles.metaLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primary} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.primaryText}>Sign in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondary} onPress={() => router.push('/profile/create')}>
            <Text style={styles.secondaryText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1f1612' },
  background: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  panel: {
    backgroundColor: '#fffaf5',
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 30,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
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
  title: { color: '#1f1a17', fontWeight: '800', fontSize: 30, textAlign: 'center' },
  subtitle: { color: '#7d726a', textAlign: 'center', lineHeight: 22, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ead7c2',
  },
  input: { flex: 1, color: '#1f1a17', fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: '#8d827a', fontSize: 12.5 },
  metaLink: { color: Colors.light.tint, fontWeight: '700', fontSize: 12.5 },
  primary: {
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondary: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ead7c2',
  },
  secondaryText: { color: '#1f1a17', fontWeight: '700', fontSize: 14 },
});
