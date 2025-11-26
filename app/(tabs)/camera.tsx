import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

const samplePhoto =
  'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=900&q=80';

export default function CameraScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.photoFrame}>
          <Image source={{ uri: samplePhoto }} style={styles.photo} contentFit="cover" />
        </View>

        <View style={styles.controlBar}>
          <Ionicons name="image-outline" size={22} color="#555" />
          <TouchableOpacity
            style={styles.shutter}
            onPress={() => router.push('/camera/review-success')}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <Ionicons name="refresh-outline" size={22} color="#555" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.tint },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photoFrame: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    width: '100%',
    aspectRatio: 9 / 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginBottom: 14,
  },
  photo: { flex: 1, borderRadius: 14 },
  controlBar: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  shutter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 34,
    height: 34,
    backgroundColor: Colors.light.tint,
    borderRadius: 17,
  },
});
