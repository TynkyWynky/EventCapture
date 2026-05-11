import { analyzeBeer } from '@/services/beerDetection';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { Colors, Radius, Shadows, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useSocial } from '@/context/SocialContext';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const tipKeys = ['cameraGuideVisible', 'cameraGuideLighting', 'cameraGuideSharp'] as const;

function CaptureHeader({
  unreadCount,
  title,
  subtitle,
  rewardHint,
  privacyNote,
  topInset,
  onBack,
  onNotifications,
  onMenu,
}: {
  unreadCount: number;
  title: string;
  subtitle: string;
  rewardHint: string;
  privacyNote: string;
  topInset: number;
  onBack: () => void;
  onNotifications: () => void;
  onMenu: () => void;
}) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.navButton}
          onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1f1a17" />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <IconActionButton
            icon="notifications-outline"
            tone="dark"
            accessibilityLabel="Notifications"
            unreadCount={unreadCount}
            onPress={onNotifications}
          />
          <IconActionButton icon="menu" tone="dark" accessibilityLabel="Menu" onPress={onMenu} />
        </View>
      </View>

      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>CAPTURE CHALLENGE</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.headerMetaRow}>
          <View style={styles.rewardPill}>
            <Ionicons name="ribbon-outline" size={14} color="#fff7ef" />
            <Text style={styles.rewardPillText}>{rewardHint}</Text>
          </View>
          <View style={styles.privacyPill}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#f5d4bb" />
            <Text style={styles.privacyPillText}>{privacyNote}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function CaptureGuide({
  width,
  height,
  topInset,
  bottomInset,
  hint,
}: {
  width: number;
  height: number;
  topInset: number;
  bottomInset: number;
  hint: string;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.guideArea,
        {
          paddingTop: topInset,
          paddingBottom: bottomInset,
        },
      ]}>
      <View style={[styles.guideFrameWrap, { width, height }]}>
        <View style={styles.guideFrameGlow} />
        <View style={styles.guideFrame}>
          <View style={styles.guideCornerTopLeft} />
          <View style={styles.guideCornerTopRight} />
          <View style={styles.guideCornerBottomLeft} />
          <View style={styles.guideCornerBottomRight} />
          <View style={styles.frameHint}>
            <Ionicons name="scan-outline" size={14} color="#fff7ef" />
            <Text style={styles.frameHintText}>{hint}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ChallengeTipsCard({
  isOpen,
  onToggle,
  title,
  body,
  privacyNote,
  nextTitle,
  nextText,
  tips,
}: {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  body: string;
  privacyNote: string;
  nextTitle: string;
  nextText: string;
  tips: string[];
}) {
  return (
    <View style={styles.tipsWrap}>
      <Pressable accessibilityRole="button" style={styles.tipsCard} onPress={onToggle}>
        <View style={styles.tipsHeader}>
          <View style={styles.tipsHeaderCopy}>
            <Text style={styles.tipsTitle}>{title}</Text>
            <Text style={styles.tipsBody}>{isOpen ? body : tips[0]}</Text>
          </View>
          <View style={styles.tipsChevron}>
            <Ionicons
              name={isOpen ? 'chevron-down' : 'chevron-up'}
              size={18}
              color="#1f1a17"
            />
          </View>
        </View>

        {isOpen ? (
          <>
            <View style={styles.tipList}>
              {tips.map((tip) => (
                <View key={tip} style={styles.tipRow}>
                  <View style={styles.tipBullet}>
                    <Ionicons name="checkmark" size={12} color={Colors.light.tint} />
                  </View>
                  <Text style={styles.tipRowText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.nextCard}>
              <Ionicons name="sparkles-outline" size={16} color={Colors.light.tint} />
              <View style={styles.nextCopy}>
                <Text style={styles.nextTitle}>{nextTitle}</Text>
                <Text style={styles.nextText}>{nextText}</Text>
              </View>
            </View>

            <View style={styles.privacyNoteRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#7a5b45" />
              <Text style={styles.privacyNoteText}>{privacyNote}</Text>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}

function CaptureControls({
  isProcessing,
  helpExpanded,
  onToggleHelp,
  onCapture,
  onSwitchCamera,
  bottomInset,
  tip,
}: {
  isProcessing: boolean;
  helpExpanded: boolean;
  onToggleHelp: () => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  bottomInset: number;
  tip: string;
}) {
  return (
    <View style={[styles.controlsDock, { paddingBottom: bottomInset }]}>
      <View style={styles.statusPill}>
        <Ionicons name="beer-outline" size={16} color="#fff7ef" />
        <Text style={styles.statusPillText}>{tip}</Text>
      </View>

      <View style={styles.controlsCard}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open challenge tips"
          style={[styles.sideButton, helpExpanded && styles.sideButtonActive]}
          disabled={isProcessing}
          onPress={onToggleHelp}>
          <Ionicons
            name={helpExpanded ? 'information-circle' : 'information-circle-outline'}
            size={22}
            color={helpExpanded ? '#fff7ef' : '#1f1a17'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Take capture"
          style={[styles.shutter, isProcessing && styles.disabledAction]}
          disabled={isProcessing}
          onPress={onCapture}>
          <View style={styles.shutterRing}>
            <View style={styles.shutterCore} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
          style={[styles.sideButton, isProcessing && styles.disabledAction]}
          disabled={isProcessing}
          onPress={onSwitchCamera}>
          <Ionicons name="camera-reverse-outline" size={22} color="#1f1a17" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CameraScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { unreadCount } = useSocial();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const frameWidth = Math.min(windowWidth - 72, 312);
  const frameHeight = Math.max(240, Math.min(Math.round(frameWidth * 1.18), Math.round(windowHeight * 0.36)));
  const guideTopInset = Math.max(insets.top + 158, 182);
  const guideBottomInset = Math.max(insets.bottom + 248, 268);
  const controlsBottomInset = Math.max(insets.bottom + 12, 24);

  if (!permission) {
    return <View style={styles.safe} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#1a120f', '#2b1b14', '#110c0a']} style={styles.permissionScreen}>
          <View style={[styles.permissionState, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.permissionCard}>
              <Text style={styles.permissionEyebrow}>CAPTURE CHALLENGE</Text>
              <Text style={styles.permissionTitle}>{t('cameraPermTitle')}</Text>
              <Text style={styles.permissionText}>{t('cameraPermText')}</Text>
              <View style={styles.permissionMeta}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#7a5b45" />
                <Text style={styles.permissionMetaText}>{t('cameraPrivacyNote')}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('cameraPermBtn')}
                onPress={requestPermission}
                style={styles.permissionBtn}>
                <Text style={styles.permissionBtnText}>{t('cameraPermBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) {
      return;
    }

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
          storedImageUri: analysis.storedImageUri ?? '',
          captureId: analysis.captureId ?? '',
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
      const message = error instanceof Error ? error.message : t('cameraErrorText');
      Alert.alert(t('cameraErrorTitle'), message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(17,12,10,0.86)', 'rgba(17,12,10,0.38)', 'rgba(17,12,10,0.10)']}
          style={styles.topGradient}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(17,12,10,0.04)', 'rgba(17,12,10,0.26)', 'rgba(17,12,10,0.88)']}
          style={styles.bottomGradient}
        />
        <View style={styles.cameraTint} pointerEvents="none" />

        <CaptureHeader
          unreadCount={unreadCount}
          title={t('cameraTitle')}
          subtitle={t('cameraSubtitle')}
          rewardHint={t('cameraRewardHint')}
          privacyNote={t('cameraPrivacyNote')}
          topInset={Math.max(insets.top + 8, 16)}
          onBack={() => router.back()}
          onNotifications={() => router.push('/notifications')}
          onMenu={() => router.push('/menu')}
        />

        <CaptureGuide
          width={frameWidth}
          height={frameHeight}
          topInset={guideTopInset}
          bottomInset={guideBottomInset}
          hint={t('cameraHint')}
        />

        <View style={styles.bottomOverlay}>
          <ChallengeTipsCard
            isOpen={isGuideOpen}
            onToggle={() => setIsGuideOpen((value) => !value)}
            title={t('cameraGuideTitle')}
            body={t('cameraGuideBody')}
            privacyNote={t('cameraPrivacyNote')}
            nextTitle={t('cameraGuideNextTitle')}
            nextText={t('cameraGuideNextText')}
            tips={tipKeys.map((key) => t(key))}
          />

          <CaptureControls
            isProcessing={isProcessing}
            helpExpanded={isGuideOpen}
            onToggleHelp={() => setIsGuideOpen((value) => !value)}
            onCapture={() => void takePicture()}
            onSwitchCamera={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
            bottomInset={controlsBottomInset}
            tip={t('cameraTip')}
          />
        </View>

        {isProcessing ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
              <Text style={styles.loadingTitle}>{t('cameraLoadingTitle')}</Text>
              <Text style={styles.loadingText}>{t('cameraLoadingText')}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#120d0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#120d0a',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,249,244,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerCard: {
    marginTop: 14,
    marginRight: 56,
    borderRadius: Radius.xxl,
    padding: 18,
    backgroundColor: 'rgba(24,17,13,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  eyebrow: {
    ...Typography.eyebrow,
    color: '#f6c8a1',
  },
  title: {
    marginTop: 8,
    color: '#fffdfa',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: '#f5e6da',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 280,
  },
  headerMetaRow: {
    marginTop: 14,
    gap: 8,
  },
  rewardPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.round,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(244,123,32,0.88)',
  },
  rewardPillText: {
    color: '#fff7ef',
    fontSize: 12.5,
    fontWeight: '700',
  },
  privacyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.round,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,247,239,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  privacyPillText: {
    color: '#f5d4bb',
    fontSize: 12.5,
    fontWeight: '600',
  },
  guideArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  guideFrameWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrameGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#fff',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  guideFrame: {
    flex: 1,
    width: '100%',
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.44)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  guideCornerTopLeft: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'rgba(255,255,255,0.72)',
    borderTopLeftRadius: 18,
  },
  guideCornerTopRight: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(255,255,255,0.72)',
    borderTopRightRadius: 18,
  },
  guideCornerBottomLeft: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'rgba(255,255,255,0.72)',
    borderBottomLeftRadius: 18,
  },
  guideCornerBottomRight: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'rgba(255,255,255,0.72)',
    borderBottomRightRadius: 18,
  },
  frameHint: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.round,
    backgroundColor: 'rgba(17,12,10,0.46)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  frameHintText: {
    color: '#fff7ef',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  tipsWrap: {
    paddingHorizontal: 16,
  },
  tipsCard: {
    borderRadius: Radius.xxl,
    padding: 16,
    backgroundColor: 'rgba(255,247,239,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...Shadows.floating,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipsHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  tipsTitle: {
    color: '#1f1a17',
    fontSize: 18,
    fontWeight: '800',
  },
  tipsBody: {
    color: '#61564d',
    fontSize: 13.5,
    lineHeight: 19,
  },
  tipsChevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff0e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipList: {
    marginTop: 14,
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipRowText: {
    flex: 1,
    color: '#4f453e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  nextCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: Radius.lg,
    backgroundColor: '#fff1e0',
    padding: 12,
  },
  nextCopy: {
    flex: 1,
    gap: 3,
  },
  nextTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 13.5,
  },
  nextText: {
    color: '#6f655e',
    fontSize: 12.5,
    lineHeight: 18,
  },
  privacyNoteRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyNoteText: {
    flex: 1,
    color: '#6e6158',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  controlsDock: {
    paddingHorizontal: 16,
  },
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.round,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(70,44,26,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...Shadows.soft,
  },
  statusPillText: {
    color: '#fff7ef',
    fontWeight: '700',
    fontSize: 12.5,
  },
  controlsCard: {
    marginTop: 12,
    minHeight: 100,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,250,245,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.floating,
  },
  sideButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f4e6d9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButtonActive: {
    backgroundColor: Colors.light.tint,
  },
  shutter: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 5,
    borderColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: Colors.light.tint,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  shutterCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.light.tint,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,12,10,0.58)',
    zIndex: 8,
  },
  loadingCard: {
    width: '84%',
    maxWidth: 320,
    borderRadius: Radius.xxl,
    padding: 22,
    backgroundColor: 'rgba(255,247,239,0.96)',
    alignItems: 'center',
    ...Shadows.floating,
  },
  loadingTitle: {
    marginTop: 14,
    color: '#1f1a17',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#5f534b',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  permissionScreen: {
    flex: 1,
  },
  permissionState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  permissionCard: {
    borderRadius: Radius.xxl,
    padding: 24,
    gap: 14,
    backgroundColor: 'rgba(255,247,239,0.96)',
    ...Shadows.floating,
  },
  permissionEyebrow: {
    ...Typography.eyebrow,
    color: Colors.light.tint,
  },
  permissionTitle: {
    color: '#1f1a17',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },
  permissionText: {
    color: '#6f655e',
    fontSize: 14.5,
    lineHeight: 22,
  },
  permissionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    backgroundColor: '#fff1e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  permissionMetaText: {
    flex: 1,
    color: '#6f655e',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  permissionBtn: {
    marginTop: 4,
    minHeight: 54,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledAction: {
    opacity: 0.5,
  },
});
