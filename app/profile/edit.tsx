import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Colors } from '@/constants/theme';

export default function EditProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Edit Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar} />
          <View style={styles.cameraBadge} />
        </View>

        <View style={styles.inputRow}>
          <TextInput placeholder="Username" placeholderTextColor="#888" style={styles.input} />
        </View>
        <View style={styles.inputRow}>
          <TextInput placeholder="Full name" placeholderTextColor="#888" style={styles.input} />
        </View>
        <View style={[styles.inputRow, { height: 100 }]}>
          <TextInput
            placeholder="Tell us about yourself"
            placeholderTextColor="#888"
            style={[styles.input, { height: '100%' }]}
            multiline
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.cta, styles.success]}>
            <Text style={styles.ctaText}>Save Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cta, styles.secondary]}>
            <Text style={[styles.ctaText, { color: '#fff' }]}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete Account</Text>
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
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  subtitle: { color: '#555', marginBottom: 4 },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcdcdc',
    borderWidth: 3,
    borderColor: '#f68c1f',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f68c1f',
  },
  inputRow: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ededed',
  },
  input: { color: '#111' },
  buttonRow: { flexDirection: 'row', gap: 10, width: '100%' },
  cta: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  success: { backgroundColor: '#26c281' },
  secondary: { backgroundColor: '#f68c1f' },
  ctaText: { color: '#fff', fontWeight: '800' },
  deleteBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4d4f',
    alignItems: 'center',
    marginTop: 6,
  },
  deleteText: { color: '#ff4d4f', fontWeight: '800' },
});
