import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ORANGE = '#f68c1f';
const ORANGE_DARK = '#ec7c0e';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={[ORANGE, ORANGE_DARK]} style={styles.background}>
        <View style={styles.card}>
          <View style={styles.logoOuter}>
            <View style={styles.crownWrap}>
              <MaterialCommunityIcons name="crown-outline" size={28} color={ORANGE_DARK} />
            </View>
            <View style={styles.iconStack}>
              <MaterialCommunityIcons name="beer" size={72} color="#ffffff" />
              <MaterialCommunityIcons
                name="camera-iris"
                size={26}
                color={ORANGE_DARK}
                style={styles.cameraIcon}
              />
            </View>
          </View>

          <Text style={styles.title}>
            <Text style={styles.titleAccent}>Bear</Text>
            <Text style={styles.titleMain}>Real</Text>
          </Text>

          <TouchableOpacity style={styles.button} activeOpacity={0.9} onPress={() => {}}>
            <Text style={styles.buttonText}>WELCOME</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ORANGE },
  background: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '78%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  logoOuter: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  crownWrap: { position: 'absolute', top: -16, left: '50%', marginLeft: -14 },
  iconStack: { alignItems: 'center', justifyContent: 'center' },
  cameraIcon: { position: 'absolute', bottom: 12, right: 12 },
  title: { marginTop: 24, marginBottom: 20, fontSize: 32, fontWeight: '600', color: '#222' },
  titleAccent: { color: ORANGE_DARK, fontWeight: '700' },
  titleMain: { color: '#222222', fontWeight: '700' },
  button: {
    backgroundColor: ORANGE,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 1.6,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
  },
});
