import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Terms and Conditions</Text>
        <View style={styles.card}>
          <ScrollView>
            <Text style={styles.body}>
              Terms and Conditions .........
              {'\n'}
              ffffffffffffffffffffffffffffffff
              {'\n'}
              ffffffffffffffffffffffffffffffff
              {'\n'}
              ffffffffffffffffffffffffffffffff
              {'\n'}
              ffffffffffffffffffffffffffffffff
              {'\n'}
              ffffffffffffffffffffffffffffffff
            </Text>
          </ScrollView>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.action, styles.agree]}>
            <Text style={styles.actionText}>Agree</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, styles.disagree]}>
            <Text style={styles.actionText}>Disagree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, gap: 14, flex: 1 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', color: '#111' },
  card: {
    flex: 1,
    backgroundColor: '#f68c1f',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  body: { color: '#fff', fontWeight: '600', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  agree: { backgroundColor: '#26c281' },
  disagree: { backgroundColor: '#ff4d4f' },
  actionText: { color: '#fff', fontWeight: '800' },
});
