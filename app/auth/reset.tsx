import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function ResetScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Ionicons name="beer-outline" size={32} color="#111" />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and we&apos;ll send you a link to reset your password</Text>

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#777" />
          <TextInput placeholder="abc@email.com" placeholderTextColor="#777" style={styles.input} />
        </View>

        <TouchableOpacity style={styles.primary}>
          <Text style={styles.primaryText}>Send Reset Link</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#111" />
          <Text style={styles.secondaryText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { color: '#555', textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    width: '100%',
  },
  input: { flex: 1, color: '#111' },
  primary: {
    marginTop: 8,
    width: '100%',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: {
    marginTop: 4,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    gap: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryText: { fontWeight: '800', color: '#111' },
});
