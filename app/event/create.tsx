import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function CreateEventScreen() {
  const router = useRouter();

  const input = (placeholder: string, icon: React.ReactNode) => (
    <View style={styles.inputRow}>
      {icon}
      <TextInput placeholder={placeholder} placeholderTextColor="#888" style={styles.input} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#111" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Event</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/menu')}>
            <Ionicons name="menu" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.uploadBox}>
          <Ionicons name="cloud-upload-outline" size={32} color="#777" />
          <Text style={styles.uploadText}>Upload event image</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Add event name ..."
          placeholderTextColor="#888"
          style={styles.textField}
        />
        <TextInput
          placeholder="Add event description ..."
          placeholderTextColor="#888"
          style={[styles.textField, { height: 80 }]}
          multiline
        />

        {input('Add address', <Ionicons name="location-outline" size={18} color="#777" />)}
        {input('dd/mm/yyyy   --:--', <Ionicons name="calendar-outline" size={18} color="#777" />)}
        {input('Add music style', <Ionicons name="musical-notes-outline" size={18} color="#777" />)}
        {input('Add price', <MaterialCommunityIcons name="currency-eur" size={18} color="#777" />)}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.createBtn]}>
            <Text style={styles.actionText}>CREATE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => router.back()}>
            <Text style={[styles.actionText, { color: '#d9534f' }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  container: { padding: 16, paddingBottom: 120 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  uploadBox: {
    height: 180,
    borderRadius: 14,
    backgroundColor: '#eaeaea',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 8,
  },
  uploadText: { color: '#777', fontWeight: '600' },
  textField: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#111',
  },
  inputRow: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, color: '#111' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: { backgroundColor: Colors.light.accent },
  cancelBtn: { backgroundColor: '#ffecec', borderWidth: 1, borderColor: '#f5b7b1' },
  actionText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
});
