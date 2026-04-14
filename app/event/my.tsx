import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/EventContext';
import { EventPlanStatus, useSocial } from '@/context/SocialContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLAN_OPTIONS: {
  status: Exclude<EventPlanStatus, null>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { status: 'going', label: 'Going', icon: 'checkmark-circle-outline' },
  { status: 'maybe', label: 'Maybe', icon: 'time-outline' },
  { status: 'skip', label: 'Skip', icon: 'close-circle-outline' },
];

function statusMeta(status: EventPlanStatus) {
  if (status === 'going') {
    return { label: 'Going', color: '#0f766e' };
  }

  if (status === 'maybe') {
    return { label: 'Maybe', color: Colors.light.tint };
  }

  if (status === 'skip') {
    return { label: 'Skip', color: '#857a72' };
  }

  return { label: 'Saved', color: '#8a7f77' };
}

export default function MyNightScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const { getEventSocial, getPlannedEvents, setEventPlanNote, setEventPlanStatus } = useSocial();
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const plannedEvents = getPlannedEvents()
    .map((entry) => {
      const event = events.find((item) => item.id === entry.eventId);

      if (!event) {
        return null;
      }

      return {
        event,
        saved: entry.saved,
        planStatus: entry.planStatus,
        planNote: entry.planNote,
        social: getEventSocial(entry.eventId),
      };
    })
    .filter(Boolean) as {
    event: (typeof events)[number];
    saved: boolean;
    planStatus: EventPlanStatus;
    planNote: string;
    social: ReturnType<typeof getEventSocial>;
  }[];

  const goingEvents = plannedEvents.filter((entry) => entry.planStatus === 'going');
  const maybeEvents = plannedEvents.filter((entry) => entry.planStatus === 'maybe');
  const savedEvents = plannedEvents.filter((entry) => !entry.planStatus || entry.planStatus === 'skip');

  const renderEventCard = (
    item: {
      event: (typeof events)[number];
      saved: boolean;
      planStatus: EventPlanStatus;
      planNote: string;
    },
    compact = false
  ) => {
    const meta = statusMeta(item.planStatus);
    const draftValue = draftNotes[item.event.id] ?? item.planNote;

    return (
      <SurfaceCard key={item.event.id} style={[styles.eventCard, compact && styles.eventCardCompact]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: '/event/detail',
              params: { eventId: item.event.id },
            })
          }>
          <AppImage source={{ uri: item.event.heroImage }} style={styles.eventImage} contentFit="cover" />
        </TouchableOpacity>

        <View style={styles.eventBody}>
          <View style={styles.eventTop}>
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle}>{item.event.title}</Text>
              <Text style={styles.eventMeta}>
                {item.event.fullDate} · {item.event.time}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${meta.color}18` }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          <View style={styles.cardStats}>
            <StatChip label="place" value={item.event.place} icon="pin-outline" />
            <StatChip label="price" value={item.event.price} icon="pricetag-outline" />
          </View>

          <View style={styles.planRow}>
            {PLAN_OPTIONS.map((option) => {
              const active = item.planStatus === option.status;

              return (
                <TouchableOpacity
                  key={option.status}
                  style={[styles.planChip, active && styles.planChipActive]}
                  onPress={() => setEventPlanStatus(item.event.id, item.event.title, active ? null : option.status)}>
                  <Ionicons
                    name={option.icon}
                    size={14}
                    color={active ? '#fff7ef' : Colors.light.tint}
                  />
                  <Text style={[styles.planChipText, active && styles.planChipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteLabel}>Night note</Text>
              <TouchableOpacity onPress={() => setEventPlanNote(item.event.id, draftValue)}>
                <Text style={styles.noteAction}>Save</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={draftValue}
              onChangeText={(value) =>
                setDraftNotes((prev) => ({
                  ...prev,
                  [item.event.id]: value,
                }))
              }
              placeholder="Meet near the entrance, leave after midnight, invite the crew..."
              placeholderTextColor="#978a80"
              style={styles.noteInput}
              multiline
            />
          </View>
        </View>
      </SurfaceCard>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="PLANNER"
          title="My Night"
          subtitle="Keep your saved events, plans and little reminders in one place."
          onBack={() => router.back()}
        />

        <LinearGradient colors={['#231b17', '#3b261b', '#6b411f']} style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Tonight planner</Text>
          <Text style={styles.heroTitle}>Build a realistic night instead of just saving random events.</Text>
          <Text style={styles.heroText}>
            Mark what you are actually going to, keep backup options nearby, and leave yourself quick notes before you head out.
          </Text>

          <View style={styles.heroStats}>
            <StatChip label="going" value={goingEvents.length.toString()} tone="dark" />
            <StatChip label="maybe" value={maybeEvents.length.toString()} tone="dark" />
            <StatChip label="saved" value={plannedEvents.length.toString()} tone="dark" />
          </View>
        </LinearGradient>

        {goingEvents.length ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Locked in</Text>
              <Text style={styles.sectionMeta}>Your actual plan</Text>
            </View>
            {goingEvents.map((item) => renderEventCard(item))}
          </>
        ) : null}

        {maybeEvents.length ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Maybe later</Text>
              <Text style={styles.sectionMeta}>Backup energy</Text>
            </View>
            {maybeEvents.map((item) => renderEventCard(item, true))}
          </>
        ) : null}

        {savedEvents.length ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved ideas</Text>
              <Text style={styles.sectionMeta}>Still undecided</Text>
            </View>
            {savedEvents.map((item) => renderEventCard(item, true))}
          </>
        ) : null}

        {!plannedEvents.length ? (
          <EmptyState
            icon="calendar-outline"
            title="Your planner is still empty"
            message="Save an event or mark one as going to start building your night."
          />
        ) : null}

        <AppButton label="Browse events" onPress={() => router.push('/(tabs)/events')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, paddingBottom: 152, gap: 16 },
  heroCard: { borderRadius: 28, padding: 18, gap: 14 },
  heroEyebrow: { color: '#f3caa5', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: '#fff7ef', fontSize: 26, fontWeight: '800', lineHeight: 31 },
  heroText: { color: '#dccabd', lineHeight: 21 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#857a72', fontWeight: '700' },
  eventCard: { padding: 14, gap: 14 },
  eventCardCompact: { backgroundColor: '#fff8f2' },
  eventImage: { width: '100%', height: 180, borderRadius: 18 },
  eventBody: { gap: 12 },
  eventTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  eventCopy: { flex: 1 },
  eventTitle: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  eventMeta: { color: '#80756d', marginTop: 4, lineHeight: 19 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusText: { fontWeight: '800', fontSize: 12 },
  cardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff1e0',
  },
  planChipActive: {
    backgroundColor: '#231b17',
  },
  planChipText: { color: Colors.light.tint, fontWeight: '800', fontSize: 12.5 },
  planChipTextActive: { color: '#fff7ef' },
  noteCard: {
    borderRadius: 18,
    backgroundColor: '#f8efe6',
    padding: 12,
    gap: 8,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteLabel: { color: '#6f655e', fontWeight: '800', fontSize: 12.5 },
  noteAction: { color: Colors.light.tint, fontWeight: '800', fontSize: 12.5 },
  noteInput: { minHeight: 58, color: '#1f1a17', textAlignVertical: 'top', lineHeight: 20 },
});
