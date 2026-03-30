import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { LogoMark } from '@/components/logo-mark';

export default function OnboardingScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <LogoMark size={48} />
        </View>
        <Text style={styles.body}>
          Explanation on BierReal fffffffffffffffffffffff gggggggggggggggggggggggg gggggggggggggggggg
          ggggggggggggggggggggggggggggggggggggggggggggg
        </Text>
        <TouchableOpacity style={styles.primary} onPress={() => router.push('/auth/login')}>
          <Text style={styles.primaryText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
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
  body: { color: '#444', lineHeight: 20 },
  primary: {
    marginTop: 8,
    width: '100%',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
});
