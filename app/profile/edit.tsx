import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>PROFILE</Text>
            <Text style={styles.title}>Edit profile</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Keep your profile fresh</Text>
          <Text style={styles.heroText}>Update your public details, bio and account presence in one clean flow.</Text>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={42} color="#9d938b" />
          </View>
          <TouchableOpacity style={styles.avatarBadge}>
            <Ionicons name="camera-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput placeholder="Update username" placeholderTextColor="#91867f" style={styles.input} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput placeholder="Update full name" placeholderTextColor="#91867f" style={styles.input} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>About you</Text>
            <TextInput
              placeholder="Update your bio"
              placeholderTextColor="#91867f"
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Save profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Change password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  eyebrow: { color: '#857a72', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#1f1a17', fontSize: 26, fontWeight: '800' },
  heroCard: { backgroundColor: '#231b17', borderRadius: 24, padding: 18 },
  heroTitle: { color: '#fff7ef', fontSize: 22, fontWeight: '800' },
  heroText: { color: '#d7c7bb', marginTop: 8, lineHeight: 21 },
  avatarWrap: { alignSelf: 'center', marginVertical: 6 },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#81776f', fontWeight: '700', fontSize: 12.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  textArea: { minHeight: 110 },
  actionRow: { gap: 12 },
  primaryBtn: { backgroundColor: Colors.light.tint, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryText: { color: '#1f1a17', fontWeight: '700' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#efb6ae',
    backgroundColor: '#fff1ee',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteText: { color: '#c64d3a', fontWeight: '800' },
});
