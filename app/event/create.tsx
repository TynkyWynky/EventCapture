import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function CreateEventScreen() {
  const router = useRouter();

  const input = (label: string, placeholder: string, icon: React.ReactNode) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {icon}
        <TextInput placeholder={placeholder} placeholderTextColor="#91867f" style={styles.input} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>HOST</Text>
            <Text style={styles.title}>Create Event</Text>
          </View>

          <TouchableOpacity style={styles.draftBtn}>
            <Text style={styles.draftText}>Draft</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Bring your next night to life</Text>
          <Text style={styles.heroText}>Create an event page that feels polished before anyone even arrives.</Text>
        </View>

        <TouchableOpacity style={styles.uploadBox} activeOpacity={0.92}>
          <View style={styles.uploadIconWrap}>
            <Ionicons name="image-outline" size={28} color={Colors.light.tint} />
          </View>
          <Text style={styles.uploadTitle}>Upload event cover</Text>
          <Text style={styles.uploadText}>Choose a strong image that instantly sets the mood.</Text>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basics</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event name</Text>
            <TextInput
              placeholder="Add event name"
              placeholderTextColor="#91867f"
              style={styles.textField}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              placeholder="Describe the atmosphere, what makes it special, and why people should come."
              placeholderTextColor="#91867f"
              style={[styles.textField, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Details</Text>

          {input('Location', 'Add address', <Ionicons name="location-outline" size={18} color="#81776f" />)}
          {input('Date & time', 'dd/mm/yyyy   --:--', <Ionicons name="calendar-outline" size={18} color="#81776f" />)}
          {input('Music or vibe', 'Add genre or atmosphere', <Ionicons name="musical-notes-outline" size={18} color="#81776f" />)}
          {input('Price', 'Add price', <MaterialCommunityIcons name="currency-eur" size={18} color="#81776f" />)}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createBtn}>
            <Text style={styles.createText}>Publish event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
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
    fontSize: 26,
    fontWeight: '800',
  },
  draftBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  draftText: { color: '#6f655e', fontWeight: '700' },
  heroCard: {
    backgroundColor: '#231b17',
    borderRadius: 24,
    padding: 18,
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    lineHeight: 21,
    marginTop: 8,
  },
  uploadBox: {
    backgroundColor: '#fffaf5',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ead7c2',
    borderStyle: 'dashed',
  },
  uploadIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#fff2e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 18 },
  uploadText: { color: '#81776f', textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 260 },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#81776f',
    fontWeight: '700',
    fontSize: 12.5,
    marginBottom: 8,
  },
  textField: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ead7c2',
    color: '#1f1a17',
  },
  textArea: {
    minHeight: 110,
  },
  inputRow: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ead7c2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, color: '#1f1a17' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  cancelText: { color: '#6f655e', fontWeight: '700' },
  createBtn: {
    flex: 1.2,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  createText: { color: '#fff', fontWeight: '800' },
});
