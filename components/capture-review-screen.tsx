import { AppImage } from '@/components/ui/app-image';
import { useEvents } from '@/context/EventContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CaptureReviewScreenProps {
  photoUri: string;
  isBeerFinished: boolean;
  onPost: (eventId: string, eventTitle: string) => void;
}

export function CaptureReviewScreen({
  photoUri,
  isBeerFinished,
  onPost,
}: CaptureReviewScreenProps) {
  const router = useRouter();
  const { events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    if (!selectedEventId && events.length) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const badgeColor = isBeerFinished ? '#0f766e' : '#7d726a';
  const accentColor = isBeerFinished ? Colors.light.tint : '#1f1a17';
  const message = isBeerFinished
    ? 'Nice shot. Post it to lock in your crown attempt for tonight.'
    : 'The crown is not unlocked this time, but the capture still deserves to be shared.';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#1f1a17" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>REVIEW</Text>
            <Text style={styles.title}>Choose the event</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Ionicons
              name={isBeerFinished ? 'ribbon' : 'image-outline'}
              size={14}
              color="#fff"
            />
            <Text style={styles.statusBadgeText}>
              {isBeerFinished ? 'Crown eligible' : 'Share only'}
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <AppImage source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />

          <View style={styles.heroBody}>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="beer-outline" size={14} color={accentColor} />
                <Text style={styles.metaText}>
                  {isBeerFinished ? 'Eligible for reward' : 'Reward not unlocked'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Post this photo to</Text>
          <Text style={styles.sectionSubtitle}>
            Pick the event people should see this capture under.
          </Text>

          <View style={styles.eventList}>
            {events.map((event) => {
              const isSelected = event.id === selectedEventId;

              return (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.92}
                  style={[styles.eventCard, isSelected && styles.eventCardSelected]}
                  onPress={() => setSelectedEventId(event.id)}>
                  <View style={styles.eventDateBadge}>
                    <Text style={styles.eventDateText}>{event.date}</Text>
                  </View>

                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventMeta}>{event.place}</Text>
                    <Text style={styles.eventMeta}>{event.attendees}</Text>
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
            <Text style={styles.footerLabel}>Selected event</Text>
            <Text style={styles.footerTitle}>
              {selectedEvent?.title ?? 'Choose an event'}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.back()}>
              <Text style={styles.secondaryActionText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryAction,
                !selectedEvent && styles.primaryActionDisabled,
              ]}
              disabled={!selectedEvent}
              onPress={() => {
                if (selectedEvent) {
                  onPost(selectedEvent.id, selectedEvent.title);
                }
              }}>
              <Text style={styles.primaryActionText}>Post capture</Text>
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
    backgroundColor: Colors.light.card,
    borderRadius: 28,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 22,
    backgroundColor: '#e8ddd2',
  },
  heroBody: {
    marginTop: 14,
    gap: 12,
  },
  message: {
    color: '#514942',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#fff3e6',
    paddingHorizontal: 12,
    paddingVertical: 9,
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
    alignItems: 'center',
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
    backgroundColor: '#f6eee4',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  eventDateText: {
    color: '#6f655e',
    fontWeight: '800',
    fontSize: 12,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 16,
  },
  eventMeta: {
    color: '#81776f',
    fontSize: 12.5,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#c8b8a8',
    alignItems: 'center',
    justifyContent: 'center',
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
});
