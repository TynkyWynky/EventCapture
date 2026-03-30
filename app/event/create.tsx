import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
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

  const handleCreate = () => {
    const locationParts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const fallbackPlace = address.trim() || 'Brussels';
    const place = locationParts[locationParts.length - 1] ?? fallbackPlace;
    const [datePart, timePart] = dateTime.includes('  ')
      ? dateTime.split('  ')
      : [dateTime, 'Time to be confirmed'];
    const createdEvent = createEvent({
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

    addActivity({
      user: user.username,
      text: `created ${createdEvent.title}`,
      icon: 'calendar-outline',
      color: Colors.light.accent,
    });
    showToast({
      tone: 'success',
      title: 'Event published',
      message: `${createdEvent.title} is now live in discovery.`,
    });

    router.replace({
      pathname: '/event/detail',
      params: { eventId: createdEvent.id },
    });
  };

  const isPublishDisabled = !title.trim() || !address.trim() || !dateTime.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="HOST"
          title="Create Event"
          subtitle="Shape the page before people even arrive."
          onBack={() => router.back()}
          rightAction={<View style={styles.draftChip}><Text style={styles.draftText}>Draft</Text></View>}
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Bring your next night to life</Text>
          <Text style={styles.heroText}>
            Create an event page that feels polished before anyone even arrives.
          </Text>

          <View style={styles.heroStats}>
            <StatChip label="host" value={user.username} />
            <StatChip label="city" value={user.city} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.uploadBox}>
          {coverUrl ? (
            <AppImage source={{ uri: coverUrl }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <View style={styles.uploadIconWrap}>
              <Ionicons name="image-outline" size={28} color={Colors.light.tint} />
            </View>
          )}
          <Text style={styles.uploadTitle}>Event cover image</Text>
          <Text style={styles.uploadText}>
            Paste an image URL to give the event a strong visual identity.
          </Text>
          <TextInput
            placeholder="https://images.unsplash.com/..."
            placeholderTextColor="#91867f"
            style={styles.coverInput}
            value={coverUrl}
            onChangeText={setCoverUrl}
            autoCapitalize="none"
          />
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basics</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Event name</Text>
            <TextInput
              placeholder="Add event name"
              placeholderTextColor="#91867f"
              style={styles.textField}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              placeholder="Describe the atmosphere, what makes it special, and why people should come."
              placeholderTextColor="#91867f"
              style={[styles.textField, styles.textArea]}
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Details</Text>

          {input('Location', 'Add address', <Ionicons name="location-outline" size={18} color="#81776f" />, address, setAddress)}
          {input('Date & time', '18 Jul 2026  20:30 - 01:00', <Ionicons name="calendar-outline" size={18} color="#81776f" />, dateTime, setDateTime)}
          {input('Music or vibe', 'Add genre or atmosphere', <Ionicons name="musical-notes-outline" size={18} color="#81776f" />, vibe, setVibe)}
          {input('Price', 'Add price', <MaterialCommunityIcons name="currency-eur" size={18} color="#81776f" />, price, setPrice)}
        </SurfaceCard>

        <View style={styles.actionRow}>
          <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} style={styles.cancelBtn} />
          <AppButton
            label="Publish event"
            onPress={handleCreate}
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
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  draftChip: {
    minWidth: 64,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftText: { color: '#6f655e', fontWeight: '700' },
  heroCard: {
    backgroundColor: '#231b17',
    gap: 12,
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    lineHeight: 21,
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
    borderRadius: 20,
    backgroundColor: '#fff2e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
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
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 20,
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
    borderRadius: 18,
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
    borderRadius: 18,
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
