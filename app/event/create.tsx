import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateEventScreen() {
  const router = useRouter();
  const { createEvent } = useEvents();
  const { addActivity } = useSocial();
  const { showToast } = useToast();
  const { user } = useUser();
  const { t } = useLanguage();
  const [coverUrl, setCoverUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [vibe, setVibe] = useState('');
  const [price, setPrice] = useState('');

  const input = (
    label: string,
    placeholder: string,
    icon: React.ReactNode,
    value: string,
    onChangeText: (text: string) => void
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {icon}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#91867f"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );

  const handleCreate = async () => {
    const locationParts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const fallbackPlace = address.trim() || 'Brussels';
    const place = locationParts[locationParts.length - 1] ?? fallbackPlace;
    const [datePart, timePart] = dateTime.includes('  ')
      ? dateTime.split('  ')
      : [dateTime, 'Time to be confirmed'];
    try {
      const createdEvent = await createEvent({
        title,
        description,
        address,
        place,
        date: datePart || 'TBD',
        fullDate: dateTime || 'Date to be confirmed',
        time: timePart || 'Time to be confirmed',
        vibe,
        price,
        priceLabel: price ? `${price} entry` : 'Free entry',
        heroImage: coverUrl,
      });

      await addActivity({
        user: user.username,
        text: `created ${createdEvent.title}`,
        icon: 'calendar-outline',
        color: Colors.light.accent,
      }).catch(() => {});
      showToast({
        tone: 'success',
        title: 'Event published',
        message: `${createdEvent.title} is now live in discovery.`,
      });

      router.replace({
        pathname: '/event/detail',
        params: { eventId: createdEvent.id },
      });
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'Event failed',
        message: error instanceof Error ? error.message : 'The event could not be published right now.',
      });
    }
  };

  const isPublishDisabled = !title.trim() || !address.trim() || !dateTime.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('createEyebrow')}
          title={t('createTitle')}
          subtitle={t('createSubtitle')}
          onBack={() => router.back()}
          mode="compact"
          rightAction={<View style={styles.draftChip}><Text style={styles.draftText}>{t('createDraft')}</Text></View>}
        />

        <SurfaceCard style={styles.heroCard} variant="feature">
          <Text style={styles.heroTitle}>{t('createHeroTitle')}</Text>
          <Text style={styles.heroText}>
            {t('createHeroText')}
          </Text>

          <View style={styles.heroStats}>
            <StatChip label={t('createStatHost')} value={user.username} />
            <StatChip label={t('createStatCity')} value={user.city} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.uploadBox} variant="subtle">
          {coverUrl ? (
            <AppImage source={{ uri: coverUrl }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <View style={styles.uploadIconWrap}>
              <Ionicons name="image-outline" size={28} color={Colors.light.tint} />
            </View>
          )}
          <Text style={styles.uploadTitle}>{t('createCoverTitle')}</Text>
          <Text style={styles.uploadText}>
            {t('createCoverText')}
          </Text>
          <TextInput
            placeholder={t('createCoverPlh')}
            placeholderTextColor="#91867f"
            style={styles.coverInput}
            value={coverUrl}
            onChangeText={setCoverUrl}
            autoCapitalize="none"
          />
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('createSectBasics')}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('createNameLabel')}</Text>
            <TextInput
              placeholder={t('createNamePlh')}
              placeholderTextColor="#91867f"
              style={styles.textField}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('createDescLabel')}</Text>
            <TextInput
              placeholder={t('createDescPlh')}
              placeholderTextColor="#91867f"
              style={[styles.textField, styles.textArea]}
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard} variant="subtle">
          <Text style={styles.sectionTitle}>{t('createSectDetails')}</Text>

          {input(t('createLocLabel'), t('createLocPlh'), <Ionicons name="location-outline" size={18} color="#81776f" />, address, setAddress)}
          {input(t('createDateLabel'), t('createDatePlh'), <Ionicons name="calendar-outline" size={18} color="#81776f" />, dateTime, setDateTime)}
          {input(t('createMusicLabel'), t('createMusicPlh'), <Ionicons name="musical-notes-outline" size={18} color="#81776f" />, vibe, setVibe)}
          {input(t('createPriceLabel'), t('createPricePlh'), <MaterialCommunityIcons name="currency-eur" size={18} color="#81776f" />, price, setPrice)}
        </SurfaceCard>

        <View style={styles.actionRow}>
          <AppButton label={t('createBtnCancel')} variant="secondary" onPress={() => router.back()} style={styles.cancelBtn} />
          <AppButton
            label={t('createBtnPublish')}
            onPress={() => void handleCreate()}
            disabled={isPublishDisabled}
            style={styles.createBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, paddingBottom: Layout.bottomPad, gap: Layout.sectionGap },
  draftChip: {
    minWidth: 64,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftText: { color: '#6f655e', fontWeight: '700' },
  heroCard: { gap: 12 },
  heroTitle: {
    ...Typography.titleSm,
    color: Colors.light.title,
  },
  heroText: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
  },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  uploadBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ead7c2',
    borderStyle: 'dashed',
  },
  uploadIconWrap: {
    width: 62,
    height: 62,
    borderRadius: Radius.lg,
    backgroundColor: '#fff2e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    marginBottom: 12,
  },
  uploadTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 18 },
  uploadText: { color: '#81776f', textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 260 },
  coverInput: {
    width: '100%',
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ead7c2',
    color: '#1f1a17',
  },
  sectionCard: {
    gap: 2,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: '#1f1a17',
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#81776f',
    fontWeight: '700',
    fontSize: 12.5,
    marginBottom: 8,
  },
  textField: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ead7c2',
    color: '#1f1a17',
  },
  textArea: {
    minHeight: 110,
  },
  inputRow: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ead7c2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, color: '#1f1a17' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1 },
  createBtn: { flex: 1.2 },
});
