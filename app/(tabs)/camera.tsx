import { analyzeBeer } from '@/services/beerDetection';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const insets = useSafeAreaInsets();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.permissionState, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              We need access to your camera so you can snap your drink without anything covering the controls.
            </Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
          const analysis = await analyzeBeer(photo.uri);
          const routeParams = {
            photoUri: photo.uri,
            analysisHeadline: analysis.summary.headline,
            analysisMessage: analysis.summary.message,
            detectedDrinks: analysis.detectedDrinks.join('|'),
            topDrink: analysis.topDrink ?? '',
            statusLabel: analysis.summary.status_label,
          };

          router.push({
            pathname: analysis.crownEligible ? '/camera/review-success' : '/camera/review-fail',
            params: routeParams,
          });
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert(
          'Detection unavailable',
          'The photo was captured, but the detector backend could not analyze it. Make sure the backend service is running and reachable from Expo.'
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>CAPTURE</Text>
            <Text style={styles.title}>Capture your drink</Text>
            <Text style={styles.subtitle}>Keep the cup inside the frame and tap the shutter.</Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity style={styles.topButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#1f1a17" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topButton} onPress={() => router.push('/menu')}>
              <Ionicons name="menu" size={20} color="#1f1a17" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.photoFrame}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          <View style={styles.frameGuide} pointerEvents="none" />
          <View style={styles.frameHint} pointerEvents="none">
            <Ionicons name="scan-outline" size={14} color="#fff7ef" />
            <Text style={styles.frameHintText}>Center the glass inside the guide</Text>
          </View>
          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
              <Text style={styles.loadingTitle}>Checking your capture</Text>
              <Text style={styles.loadingText}>Uploading the photo to the detection backend and preparing your review.</Text>
            </View>
          )}
        </View>

        <View style={[styles.controlDock, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.tipPill}>
            <Ionicons name="beer-outline" size={16} color="#fff7ef" />
            <Text style={styles.tipText}>Best result: keep the glass fully visible.</Text>
          </View>

          <View style={styles.controlBar}>
            <View style={styles.sideButtonPlaceholder} />
          <TouchableOpacity
            style={[styles.shutter, isProcessing && { opacity: 0.5 }]}
            onPress={takePicture}
            disabled={isProcessing}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
            <TouchableOpacity
              style={styles.sideButton}
              onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
              disabled={isProcessing}>
              <Ionicons name="camera-reverse-outline" size={22} color="#1f1a17" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.tint },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 10,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
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
  subtitle: {
    color: '#ffe1ca',
    marginTop: 6,
    maxWidth: 240,
    lineHeight: 20,
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
    flex: 1,
    borderRadius: 28,
    padding: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    marginBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: { flex: 1, borderRadius: 14 },
  frameGuide: {
    position: 'absolute',
    top: '16%',
    left: '12%',
    right: '12%',
    bottom: '20%',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  frameHint: {
    position: 'absolute',
    top: 26,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(17,12,10,0.38)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  frameHintText: {
    color: '#fff7ef',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,12,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  loadingTitle: {
    marginTop: 12,
    fontWeight: '800',
    color: '#fff7ef',
    fontSize: 18,
  },
  loadingText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#fff7ef',
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 20,
  },
  controlDock: {
    gap: 12,
  },
  tipPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(35,27,23,0.42)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tipText: {
    color: '#fff7ef',
    fontWeight: '600',
    fontSize: 12.5,
  },
  controlBar: {
    minHeight: 92,
    backgroundColor: '#fffaf5',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  sideButtonPlaceholder: {
    width: 52,
    height: 52,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f3e5d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 6,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  shutterInner: {
    width: 44,
    height: 44,
    backgroundColor: Colors.light.tint,
    borderRadius: 22,
  },
  permissionState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  permissionCard: {
    backgroundColor: '#fffaf5',
    borderRadius: 28,
    padding: 24,
    gap: 14,
  },
  permissionTitle: {
    color: '#1f1a17',
    fontSize: 24,
    fontWeight: '800',
  },
  permissionText: {
    color: '#6f655e',
    lineHeight: 21,
  },
  permissionBtn: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
