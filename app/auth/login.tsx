import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Ionicons name="beer-outline" size={36} color="#111" />
        </View>
        <Text style={styles.title}>
          <Text style={{ color: Colors.light.tint }}>Bear</Text>
          <Text>Real</Text>
        </Text>
        <Text style={styles.subtitle}>Sign in to continue your beer journey</Text>

        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="#777" />
          <TextInput placeholder="abc@email.com" style={styles.input} placeholderTextColor="#777" />
        </View>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#777" />
          <TextInput
            placeholder="Your password"
            style={styles.input}
            placeholderTextColor="#777"
            secureTextEntry
          />
          <Ionicons name="eye-outline" size={18} color="#777" />
        </View>

        <View style={styles.inline}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.toggle} />
            <Text style={styles.inlineText}>Remember Me</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/auth/reset')}>
            <Text style={[styles.inlineText, { color: Colors.light.tint }]}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primary}
          onPress={() => router.push('/(tabs)')}>
          <Text style={styles.primaryText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <Text style={styles.inlineText}>Don&apos;t have an account?</Text>
        </View>

        <TouchableOpacity style={styles.secondary}>
          <Text style={styles.secondaryText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={[styles.inlineText, { marginTop: 12 }]}>OR</Text>
        <View style={styles.oauthRow}>
          <TouchableOpacity style={styles.oauthBtn}>
            <Ionicons name="logo-google" size={18} color="#111" />
            <Text style={styles.oauthText}>Login with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.oauthBtn}>
            <Ionicons name="logo-facebook" size={18} color="#1877f2" />
            <Text style={styles.oauthText}>Login with Facebook</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111' },
  subtitle: { color: '#555', textAlign: 'center', marginBottom: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    width: '100%',
  },
  input: { flex: 1, color: '#111' },
  inline: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  inlineText: { color: '#666', fontWeight: '600' },
  primary: {
    marginTop: 12,
    width: '100%',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  divider: { marginTop: 10 },
  secondary: {
    marginTop: 8,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  secondaryText: { fontWeight: '800', color: '#111' },
  oauthRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  oauthBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  oauthText: { fontWeight: '700', color: '#111' },
});
