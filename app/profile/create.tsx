import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/theme';

export default function CreateProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={20} color="#1f1a17" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>PROFILE</Text>
                <Text style={styles.title}>Create your profile</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Set up the basics so your account already feels personal from the start.</Text>

            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Ionicons name="person-outline" size={40} color="#9d938b" />
              </View>
              <TouchableOpacity style={styles.avatarBadge}>
                <Ionicons name="camera-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput placeholder="Choose a username" placeholderTextColor="#91867f" style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <TextInput placeholder="Add your full name" placeholderTextColor="#91867f" style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>About you</Text>
              <TextInput
                placeholder="What kind of events do you love most?"
                placeholderTextColor="#91867f"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.primary}>
              <Text style={styles.primaryText}>Complete profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1f1612' },
  background: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  card: {
    backgroundColor: '#fffaf5',
    borderRadius: 30,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: '#857a72', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#1f1a17', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#7d726a', lineHeight: 21 },
  avatarWrap: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fffaf5',
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
  primary: {
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
