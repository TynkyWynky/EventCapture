import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>LEGAL</Text>
            <Text style={styles.title}>Terms & privacy</Text>
          </View>
        </View>

        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>
              These terms describe how EventCapture should be used respectfully and safely. By continuing to use the app, you agree to share accurate information, follow community standards, and avoid abusive or misleading content.
              {'\n\n'}
              We may use account activity, captures and event interactions to improve the experience, personalize recommendations and keep the platform secure. You remain responsible for the content you upload and for respecting the rules of the venues and events you attend.
              {'\n\n'}
              If you need clarification about privacy, account handling or data requests, please reach out through the support section.
            </Text>
          </ScrollView>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.action, styles.secondary]} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, styles.primary]}>
            <Text style={styles.primaryText}>Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 16, flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#857a72',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 26,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  body: { color: '#514943', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  action: { flex: 1, paddingVertical: 15, borderRadius: 18, alignItems: 'center' },
  secondary: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  primary: { backgroundColor: Colors.light.tint },
  secondaryText: { color: '#6f655e', fontWeight: '800' },
  primaryText: { color: '#fff', fontWeight: '800' },
});
