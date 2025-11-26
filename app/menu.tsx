import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const menuItems = [
  { label: 'My Profile', icon: 'person-outline', route: '/profile' },
  { label: 'Edit Profile', icon: 'create-outline', route: '/profile/edit' },
  { label: 'My Events', icon: 'calendar-outline', route: '/event/my' },
  { label: 'Help & FAQ', icon: 'help-circle-outline', route: '/faq' },
  { label: 'Contact Us', icon: 'mail-outline', route: '/contact' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings' },
];

export default function MenuScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Menu</Text>
        <View style={styles.langRow}>
          {['EN', 'NL', 'FR'].map(code => (
            <View key={code} style={[styles.lang, code === 'NL' && { backgroundColor: '#ffd60a' }]}>
              <Text style={{ color: '#111', fontWeight: '800' }}>{code}</Text>
            </View>
          ))}
        </View>

        {menuItems.map(item => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Ionicons name={item.icon as any} size={20} color="#333" />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.signOut}>
          <Ionicons name="log-out-outline" size={20} color="#d9534f" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    width: '75%',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: -4, height: 0 },
    elevation: 12,
  },
  title: { textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#111' },
  langRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 4 },
  lang: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ededed',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuLabel: { fontWeight: '700', color: '#222' },
  signOut: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  signOutText: { color: '#d9534f', fontWeight: '800' },
});
