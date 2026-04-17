import { AppImage } from '@/components/ui/app-image';
import { useEvents } from '@/context/EventContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/context/LanguageContext';

interface CaptureReviewScreenProps {
  photoUri: string;
  isBeerFinished: boolean;
  onPost: (eventId: string, eventTitle: string) => void | Promise<void>;
}

export function CaptureReviewScreen({
  photoUri,
  isBeerFinished,
  onPost,
}: CaptureReviewScreenProps) {
  const router = useRouter();
  const { events } = useEvents();
  const { t } = useLanguage();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!selectedEventId && events.length) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const badgeColor = isBeerFinished ? '#0f766e' : '#8a6a52';
  const accentColor = isBeerFinished ? Colors.light.tint : '#8a6a52';
  const title = isBeerFinished ? t('reviewSuccessTitle') : t('reviewFailTitle');
  const message = isBeerFinished
    ? t('reviewSuccessMsg')
    : t('reviewFailMsg');
  const eventHint = isBeerFinished
    ? t('reviewSuccessHint')
    : t('reviewFailHint');

  const handleSubmit = async () => {
    if (!selectedEvent || isPosting) {
      return;
    }

    setIsPosting(true);
    await new Promise((resolve) => setTimeout(resolve, 260));
    await Promise.resolve(onPost(selectedEvent.id, selectedEvent.title));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{t('reviewEyebrow')}</Text>
            <Text style={styles.title}>{t('reviewTitle')}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Ionicons
              name={isBeerFinished ? 'ribbon' : 'image-outline'}
              size={14}
              color="#fff"
            />
            <Text style={styles.statusBadgeText}>
              {isBeerFinished ? t('reviewBadgeSuccess') : t('reviewBadgeFail')}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={isBeerFinished ? ['#fff8f0', '#fff2e3'] : ['#fffaf5', '#f5ece3']}
          style={styles.heroCard}>
          <View style={styles.heroVisual}>
            {isBeerFinished ? <View style={styles.heroSparkle} /> : null}
            <AppImage source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            <View style={[styles.photoBadge, isBeerFinished ? styles.photoBadgeSuccess : styles.photoBadgeSoft]}>
              <Ionicons
                name={isBeerFinished ? 'ribbon' : 'images-outline'}
                size={18}
                color="#fff"
              />
            </View>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={[styles.metaPill, isBeerFinished ? styles.metaPillWarm : styles.metaPillSoft]}>
                <Ionicons
                  name={isBeerFinished ? 'sparkles-outline' : 'heart-outline'}
                  size={14}
                  color={accentColor}
                />
                <Text style={styles.metaText}>
                  {isBeerFinished ? t('reviewMetaEligible') : t('reviewMetaWorth')}
                </Text>
              </View>
              <View style={[styles.metaPill, isBeerFinished ? styles.metaPillWarm : styles.metaPillSoft]}>
                <Ionicons name="albums-outline" size={14} color={accentColor} />
                <Text style={styles.metaText}>
                  {isBeerFinished ? t('reviewMetaCrown') : t('reviewMetaStory')}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('reviewSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{eventHint}</Text>

          <View style={styles.eventList}>
            {events.map((event) => {
              const isSelected = event.id === selectedEventId;

              return (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.92}
                  style={[styles.eventCard, isSelected && styles.eventCardSelected]}
                  onPress={() => setSelectedEventId(event.id)}>
                  <LinearGradient
                    colors={isSelected ? ['#f7a24d', '#f47b20'] : ['#f6eee4', '#f6eee4']}
                    style={styles.eventDateBadge}>
                    <Text style={[styles.eventDateText, isSelected && styles.eventDateTextSelected]}>{event.date}</Text>
                  </LinearGradient>

                  <AppImage source={{ uri: event.heroImage }} style={styles.eventThumb} contentFit="cover" />

                  <View style={styles.eventBody}>
                    <View style={styles.eventTopRow}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {isSelected ? (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedPillText}>{t('reviewSelectedPill')}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.eventMeta}>{event.place}</Text>
                    <Text style={styles.eventMeta}>{event.attendees}</Text>
                    <Text style={styles.eventTagline}>{event.vibe}</Text>
                  </View>

                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.footerCard}>
          <View>
            <Text style={styles.footerLabel}>{t('reviewFooterLabel')}</Text>
            <Text style={styles.footerTitle}>
              {selectedEvent?.title ?? t('reviewFooterEmpty')}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => router.back()}>
              <Text style={styles.secondaryActionText}>{t('reviewBtnRetake')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryAction,
                !selectedEvent && styles.primaryActionDisabled,
                isPosting && styles.primaryActionDisabled,
              ]}
              disabled={!selectedEvent || isPosting}
              onPress={handleSubmit}>
              {isPosting ? (
                <View style={styles.postingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.primaryActionText}>{t('reviewBtnPosting')}</Text>
                </View>
              ) : (
                <Text style={styles.primaryActionText}>
                  {isBeerFinished ? t('reviewBtnSuccess') : t('reviewBtnFail')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 28, gap: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: '#857a72',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: '#1f1a17',
    fontSize: 26,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 28,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroVisual: {
    position: 'relative',
  },
  heroSparkle: {
    position: 'absolute',
    top: -8,
    right: -4,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(244,123,32,0.12)',
    zIndex: 1,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 22,
    backgroundColor: '#e8ddd2',
  },
  photoBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  photoBadgeSuccess: {
    backgroundColor: '#0f766e',
  },
  photoBadgeSoft: {
    backgroundColor: '#8a6a52',
  },
  heroBody: {
    marginTop: 14,
    gap: 12,
  },
  heroCopy: {
    gap: 6,
  },
  heroTitle: {
    color: '#1f1a17',
    fontSize: 22,
    fontWeight: '800',
  },
  message: {
    color: '#514942',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metaPillWarm: {
    backgroundColor: '#fff3e6',
  },
  metaPillSoft: {
    backgroundColor: '#f3ece5',
  },
  metaText: {
    color: '#1f1a17',
    fontWeight: '700',
    fontSize: 12.5,
  },
  sectionCard: {
    backgroundColor: '#fffaf5',
    borderRadius: 28,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: '#1f1a17',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#81776f',
    lineHeight: 20,
  },
  eventList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ead7c2',
    backgroundColor: '#fff',
    padding: 14,
  },
  eventCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#fff5eb',
  },
  eventDateBadge: {
    minWidth: 62,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDateText: {
    color: '#6f655e',
    fontWeight: '800',
    fontSize: 12,
  },
  eventDateTextSelected: {
    color: '#fff',
  },
  eventThumb: {
    width: 64,
    borderRadius: 16,
  },
  eventBody: {
    flex: 1,
  },
  eventTopRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  eventTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 16,
    flex: 1,
  },
  eventMeta: {
    color: '#81776f',
    fontSize: 12.5,
    marginTop: 2,
  },
  eventTagline: {
    color: '#8a6a52',
    fontSize: 12.5,
    marginTop: 6,
    fontWeight: '700',
  },
  selectedPill: {
    borderRadius: 999,
    backgroundColor: '#fff1e0',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedPillText: {
    color: Colors.light.tint,
    fontSize: 11,
    fontWeight: '800',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#c8b8a8',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.light.tint,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
  },
  footerCard: {
    backgroundColor: '#231b17',
    borderRadius: 28,
    padding: 18,
    gap: 16,
  },
  footerLabel: {
    color: '#decfc2',
    fontSize: 12,
    fontWeight: '700',
  },
  footerTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#fff7ef',
    fontWeight: '700',
  },
  primaryAction: {
    flex: 1.35,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryActionDisabled: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '800',
  },
  postingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
