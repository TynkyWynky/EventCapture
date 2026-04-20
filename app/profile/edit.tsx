import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, signOut } = useUser();
  const { showToast } = useToast();
  const [avatarUri, setAvatarUri] = useState(user.avatarUri);
  const [username, setUsername] = useState(user.username);
  const [fullName, setFullName] = useState(user.fullName);
  const [city, setCity] = useState(user.city);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio);
  const { t } = useLanguage();

  const handleDeleteAccount = () => {
    Alert.alert(
      t('editProfAlertDelTitle'),
      t('editProfAlertDelMsg'),
      [
        { text: t('editProfAlertCancel'), style: 'cancel' },
        {
          text: t('editProfAlertDelete'),
          style: 'destructive',
          onPress: () => {
            signOut();
            showToast({
              tone: 'info',
              title: t('editProfDelToastTitle'),
              message: t('editProfDelToastMsg'),
            });
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('editProfEyebrow')}
          title={t('editProfTitle')}
          subtitle={t('editProfSubtitle')}
          onBack={() => router.back()}
          mode="compact"
        />

        <SurfaceCard style={styles.heroCard} variant="feature">
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <AppImage source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person-outline" size={42} color="#9d938b" />
              )}
            </View>
            <TouchableOpacity style={styles.avatarBadge} onPress={pickAvatar}>
              <Ionicons name="camera-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{t('editProfHeroTitle')}</Text>
          <Text style={styles.heroText}>
            {t('editProfHeroText')}
          </Text>

          <View style={styles.heroStats}>
            <StatChip label={t('editProfLblUser')} value={username || user.username} />
            <StatChip label={t('editProfLblCity')} value={city || user.city} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('editProfLblUser')}</Text>
            <TextInput
              placeholder={t('editProfPlhUser')}
              placeholderTextColor="#91867f"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('editProfLblName')}</Text>
            <TextInput
              placeholder={t('editProfPlhName')}
              placeholderTextColor="#91867f"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('editProfLblEmail')}</Text>
            <TextInput
              placeholder={t('editProfPlhEmail')}
              placeholderTextColor="#91867f"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('editProfLblCity')}</Text>
            <TextInput
              placeholder={t('editProfPlhCity')}
              placeholderTextColor="#91867f"
              style={styles.input}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('editProfLblBio')}</Text>
            <TextInput
              placeholder={t('editProfPlhBio')}
              placeholderTextColor="#91867f"
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
            />
          </View>
        </SurfaceCard>

        <View style={styles.actionRow}>
          <AppButton
            label={t('editProfBtnSave')}
            onPress={() => {
              updateProfile({ avatarUri, username, fullName, city, bio, email });
              showToast({
                tone: 'success',
                title: t('editProfToastTitle'),
                message: t('editProfToastMsg'),
              });
              router.back();
            }}
          />
          <AppButton label={t('editProfBtnPass')} variant="secondary" onPress={() => router.push('/auth/change-password')} />
          <AppButton label={t('editProfBtnDel')} variant="danger" onPress={handleDeleteAccount} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: Layout.sectionGap },
  heroCard: { alignItems: 'center', gap: 12 },
  avatarWrap: { marginVertical: 6 },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  heroTitle: { ...Typography.titleSm, color: Colors.light.title, textAlign: 'center' },
  heroText: { ...Typography.bodySm, color: Colors.light.subtitle, textAlign: 'center' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  sectionCard: { gap: 14 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#81776f', fontWeight: '700', fontSize: 12.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  textArea: { minHeight: 110 },
  actionRow: { gap: 12 },
});
