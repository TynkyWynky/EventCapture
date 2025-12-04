import { usePosts } from '@/context/PostContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReviewFailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const { addPost } = usePosts();

  const handlePost = () => {
    if (photoUri) {
      addPost({
        imageUri: photoUri,
        isBeerFinished: false,
        eventTitle: 'Unknown Event',
      });
      router.push('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.message}>
          Sorry, you didn&apos;t win the crown. You can still share this beautiful photo.
        </Text>
        <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />

        <View style={styles.selectRow}>
          <TouchableOpacity style={styles.select}>
            <Text style={styles.selectText}>Select Event</Text>
            <Ionicons name="chevron-down" size={16} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.post]} onPress={handlePost}>
            <Text style={styles.btnText}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.retake]} onPress={() => router.back()}>
            <Text style={[styles.btnText, { color: '#111' }]}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16, alignItems: 'center', gap: 12 },
  message: { textAlign: 'center', color: '#555', marginTop: 6 },
  photo: {
    width: 240,
    height: 320,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  selectRow: { width: '100%', alignItems: 'center', marginTop: 6 },
  select: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectText: { fontWeight: '700', color: '#111' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  post: { backgroundColor: '#26c281' },
  retake: { backgroundColor: '#ffd52e' },
  btnText: { fontWeight: '800', color: '#fff' },
});
