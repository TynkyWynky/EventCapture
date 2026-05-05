import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, deleteAccount, isBusy } = useUser();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [avatarUri, setAvatarUri] = useState(user.avatarUri);
  const [username, setUsername] = useState(user.username);
  const [fullName, setFullName] = useState(user.fullName);
  const [city, setCity] = useState(user.city);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio);

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
            void deleteAccount().then((result) => {
              if (!result.ok) {
                showToast({
                  tone: 'error',
                  title: t('accountDeleteFailedTitle'),
                  message: result.error ?? t('accountDeleteFailedMessage'),
                });
                return;
              }

              showToast({
                tone: 'info',
                title: t('editProfDelToastTitle'),
                message: t('editProfDelToastMsg'),
              });
              router.replace('/auth/login');
            });
          },
        },
      ]
    );
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t('createProfilePhotoAccessTitle'),
        t('createProfilePhotoAccessMessage')
      );
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.container}>
          <ScreenHeader
            eyebrow={t('editProfEyebrow')}
            title={t('editProfTitle')}
            subtitle={t('editProfSubtitle')}
            onBack={() => router.back()}
          />

          <SurfaceCard style={styles.heroCard}>
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
              <StatChip label="username" value={username || user.username} />
              <StatChip label="city" value={city || user.city} />
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
                keyboardType="email-address"
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
              label={isBusy ? t('editProfBtnSaving') : t('editProfBtnSave')}
              onPress={async () => {
                const result = await updateProfile({ avatarUri, username, fullName, city, bio, email });
                if (!result.ok) {
                  showToast({
                    tone: 'error',
                    title: t('editProfTitle'),
                    message: result.error ?? t('editProfSaveFailedMessage'),
                  });
                  return;
                }

                showToast({
                  tone: 'success',
                  title: t('editProfToastTitle'),
                  message: t('editProfToastMsg'),
                });
                router.back();
              }}
              disabled={isBusy}
            />
            <AppButton
              label={t('editProfBtnPass')}
              variant="secondary"
              onPress={() => router.push('/auth/change-password')}
              disabled={isBusy}
            />
            <AppButton label={t('editProfBtnDel')} variant="danger" onPress={handleDeleteAccount} disabled={isBusy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 16, paddingBottom: 152, gap: 16 },
  heroCard: { backgroundColor: '#231b17', alignItems: 'center', gap: 12 },
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
  heroTitle: { color: '#fff7ef', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroText: { color: '#d7c7bb', lineHeight: 21, textAlign: 'center' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  sectionCard: { gap: 14 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#81776f', fontWeight: '700', fontSize: 12.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  textArea: { minHeight: 110 },
  actionRow: { gap: 12 },
});
