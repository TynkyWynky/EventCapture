import { analyzeBeer } from '@/services/beerDetection';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
        });

        if (photo?.uri) {
          // Analyze the beer
          const isBeerFinished = await analyzeBeer(photo.uri);

          if (isBeerFinished) {
            router.push({
              pathname: '/camera/review-success',
              params: { photoUri: photo.uri },
            });
          } else {
            router.push({
              pathname: '/camera/review-fail',
              params: { photoUri: photo.uri },
            });
          }
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>CAPTURE</Text>
            <Text style={styles.title}>Frame the moment</Text>
          </View>

          <TouchableOpacity style={styles.topButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={20} color="#1f1a17" />
          </TouchableOpacity>
        </View>

        <View style={styles.photoFrame}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef} />
          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
              <Text style={styles.loadingText}>Analyzing Beer...</Text>
            </View>
          )}
        </View>

        <View style={styles.controlBar}>
          <Ionicons name="image-outline" size={22} color="#555" />
          <TouchableOpacity
            style={[styles.shutter, isProcessing && { opacity: 0.5 }]}
            onPress={takePicture}
            disabled={isProcessing}>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 132,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eyebrow: {
    color: '#fff0e1',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
    marginTop: 2,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fffaf5',
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
    position: 'relative',
  },
  camera: { flex: 1, borderRadius: 14 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  loadingText: {
    marginTop: 10,
    fontWeight: '700',
    color: Colors.light.tint,
  },
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
  permissionBtn: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
