import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const ORANGE = '#f68c1f';
const ORANGE_DARK = '#ec7c0e';

export default function SplashScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={[ORANGE, ORANGE_DARK]} style={styles.background}>
        <View style={styles.card}>
          <View style={styles.logoOuter}>
            <Image
              source={require('@/assets/images/splash-icon.png')}
              style={styles.logo}
              contentFit="contain"
              transition={200}
            />
          </View>

          <Text style={styles.title}>
            <Text style={styles.titleAccent}>Bear</Text>
            <Text style={styles.titleMain}>Real</Text>
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.9}
            onPress={() => router.push('/auth/login')}>
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
    borderRadius: 18,
    paddingVertical: 42,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    gap: 18,
  },
  logoOuter: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 16,
  },
  title: { fontSize: 34, fontWeight: '700', color: '#222', letterSpacing: 0.5 },
  titleAccent: { color: ORANGE_DARK, fontWeight: '800' },
  titleMain: { color: '#222222', fontWeight: '800' },
  button: {
    marginTop: 6,
    backgroundColor: ORANGE,
    paddingVertical: 13,
    paddingHorizontal: 46,
    borderRadius: 10,
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
