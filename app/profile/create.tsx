import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Colors } from '@/constants/theme';

export default function CreateProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <View style={styles.avatar} />

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

        <TouchableOpacity style={styles.primary}>
          <Text style={styles.primaryText}>Complete Profile</Text>
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcdcdc',
    borderWidth: 3,
    borderColor: '#f68c1f',
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
  primary: {
    marginTop: 4,
    width: '100%',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
});
