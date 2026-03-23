import React from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/theme';
import { LogoMark } from '@/components/logo-mark';

export default function ResetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <LogoMark size={48} />
          </View>

          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a link to get back into your account.</Text>

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#81776f" />
            <TextInput placeholder="demo@eventcapture.app" placeholderTextColor="#9a9189" style={styles.input} />
          </View>

          <TouchableOpacity style={styles.primary}>
            <Text style={styles.primaryText}>Send reset link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondary} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#1f1a17" />
            <Text style={styles.secondaryText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1f1612' },
  background: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: {
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
    width: 72,
    height: 72,
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
    borderColor: Colors.light.border,
  },
  input: { flex: 1, color: '#1f1a17', fontWeight: '600' },
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
    borderColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: { color: '#1f1a17', fontWeight: '700', fontSize: 14 },
});
