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
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = typeof params.eventId === 'string' ? params.eventId : '';
  
  const { getEventById, updateEvent } = useEvents();
  const { addActivity } = useSocial();
  const { showToast } = useToast();
  const { user } = useUser();

  const event = getEventById(eventId);

  const [coverUrl, setCoverUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [vibe, setVibe] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    // If we're not an admin, we shouldn't really be here, but let's just populate the form
    if (event) {
      setCoverUrl(event.heroImage || '');
      setTitle(event.title || '');
      setDescription(event.description || '');
      setAddress(event.address || '');
      setDateTime(event.fullDate || '');
      setVibe(event.vibe || '');
      setPrice(event.price || '');
    }
  }, [event]);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader eyebrow="ADMIN" title="Event Not Found" onBack={() => router.back()} mode="compact" />
      </SafeAreaView>
    );
  }

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

  const handleUpdate = () => {
    const locationParts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const fallbackPlace = address.trim() || 'Brussels';
    const place = locationParts[locationParts.length - 1] ?? fallbackPlace;
    
    // We try to extract simple date/time if it's separated by double spaces like in create.tsx
    const [datePart, timePart] = dateTime.includes('  ')
      ? dateTime.split('  ')
      : [dateTime, event.time]; // fallback to old time if no double spaces used

    updateEvent(eventId, {
      title,
      description,
      address,
      place,
      date: datePart || 'TBD',
      fullDate: dateTime || 'Date to be confirmed',
      time: timePart || event.time,
      vibe,
      price,
      priceLabel: price ? `${price} entry` : 'Free entry',
      heroImage: coverUrl,
    });

    addActivity({
      user: user.username,
      text: `updated event ${title}`,
      icon: 'create-outline',
      color: Colors.light.accent,
    });
    
    showToast({
      tone: 'success',
      title: 'Event updated',
      message: `${title} has been updated successfully.`,
    });

    router.back();
  };

  const isPublishDisabled = !title.trim() || !address.trim() || !dateTime.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="ADMIN"
          title="Edit Event"
          subtitle="Update event details on the fly."
          onBack={() => router.back()}
          rightAction={<View style={styles.draftChip}><Text style={styles.draftText}>Live</Text></View>}
          mode="compact"
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Modify {event.title}</Text>
          <Text style={styles.heroText}>
            Keep your attendees informed with the latest updates.
          </Text>

          <View style={styles.heroStats}>
            <StatChip label="host" value={event.hostName} />
            <StatChip label="city" value={event.place} />
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
            Update the visual identity of the event.
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
              placeholder="Describe the atmosphere..."
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
            label="Save Changes"
            onPress={handleUpdate}
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
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftText: { color: '#166534', fontWeight: '700' },
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
