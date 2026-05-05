import { AppButton } from '@/components/ui/app-button';
import { AppImage } from '@/components/ui/app-image';
import { EmptyState } from '@/components/ui/empty-state';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { StatChip } from '@/components/ui/stat-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useEvents } from '@/context/EventContext';
import { useSocial } from '@/context/SocialContext';
import { Colors, Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventDetailScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { getEventById } = useEvents();
  const { getEventSocial, toggleEventLike, toggleEventSave, setEventPlanStatus } = useSocial();
  const event = getEventById(eventId);
  const social = getEventSocial(eventId);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const handleOpenTickets = async () => {
    if (!event?.sourceUrl) {
      return;
    }

    const supported = await Linking.canOpenURL(event.sourceUrl);
    if (supported) {
      await Linking.openURL(event.sourceUrl);
    }
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missingWrap}>
          <EmptyState
            icon="calendar-clear-outline"
            title={t('detailEmptyTitle')}
            message={t('detailEmptyMsg')}
          />
          <AppButton label={t('detailBtnBack')} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 116 + Math.max(insets.bottom, 16),
        }}>
        <View style={styles.heroWrap}>
          <AppImage source={{ uri: event.heroImage }} style={styles.hero} contentFit="cover" />

          <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(28,18,13,0.82)']} style={styles.heroOverlay}>
            <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 18) }]}>
              <IconActionButton icon="chevron-back" tone="dark" onPress={() => router.back()} />

              <View style={styles.topActions}>
                <IconActionButton
                  icon={social?.liked ? 'heart' : 'heart-outline'}
                  tone="dark"
                  onPress={() => toggleEventLike(event.id, event.title)}
                />
                <IconActionButton
                  icon={social?.saved ? 'bookmark' : 'bookmark-outline'}
                  tone="dark"
                  onPress={() => toggleEventSave(event.id, event.title)}
                />
              </View>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{event.badge}</Text>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.subtitle}>{event.description}</Text>

              <View style={styles.metaRow}>
                <StatChip label={t('detailStatDate')} value={event.date} icon="calendar-outline" tone="dark" />
                <StatChip label={t('detailStatTime')} value={event.time} icon="time-outline" tone="dark" />
                <StatChip label={t('detailStatCrowd')} value={event.attendees} icon="people-outline" tone="dark" />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          <View style={styles.statRow}>
            <StatChip label={t('detailStatPreSale')} value={event.price} tone="accent" />
            <StatChip label={t('detailStatLoc')} value={event.place} tone="light" />
            <StatChip label={t('detailStatExp')} value={event.experience} tone="light" />
          </View>

          <SurfaceCard style={styles.card}>
            <Text style={styles.sectionTitle}>{t('detailSectAbout')}</Text>
            <Text style={styles.description}>{event.description}</Text>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => toggleEventLike(event.id, event.title)}>
                <Ionicons
                  name={social?.liked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={Colors.light.tint}
                />
                <Text style={styles.socialButtonText}>{social?.likes.length ?? 0} {t('detailSocialLikes')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() =>
                  router.push({
                    pathname: '/comments',
                    params: { eventId: event.id },
                  })
                }>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.socialButtonText}>{social?.comments.length ?? 0} {t('detailSocialComments')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => toggleEventSave(event.id, event.title)}>
                <Ionicons
                  name={social?.saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={Colors.light.tint}
                />
                <Text style={styles.socialButtonText}>{social?.saved ? t('detailSocialSaved') : t('detailSocialSave')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagRow}>
              {event.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.card} variant="subtle">
            <View style={styles.plannerHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t('detailSectMyNight')}</Text>
                <Text style={styles.plannerText}>
                  {t('detailPlannerText')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/event/my')}>
                <Text style={styles.plannerLink}>{t('detailPlannerLink')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planActionRow}>
              <TouchableOpacity
                style={[styles.planActionChip, social?.planStatus === 'going' && styles.planActionChipActive]}
                onPress={() => setEventPlanStatus(event.id, event.title, social?.planStatus === 'going' ? null : 'going')}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={social?.planStatus === 'going' ? '#fff7ef' : Colors.light.tint}
                />
                <Text style={[styles.planActionText, social?.planStatus === 'going' && styles.planActionTextActive]}>
                  {t('detailPlanGoing')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.planActionChip, social?.planStatus === 'maybe' && styles.planActionChipActive]}
                onPress={() => setEventPlanStatus(event.id, event.title, social?.planStatus === 'maybe' ? null : 'maybe')}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={social?.planStatus === 'maybe' ? '#fff7ef' : Colors.light.tint}
                />
                <Text style={[styles.planActionText, social?.planStatus === 'maybe' && styles.planActionTextActive]}>
                  {t('detailPlanMaybe')}
                </Text>
              </TouchableOpacity>
            </View>

            {social?.planNote ? <Text style={styles.plannerNote}>{t('detailPlanNote')} {social.planNote}</Text> : null}
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <Text style={styles.sectionTitle}>{t('detailSectDetails')}</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="pin-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>{t('detailLblLoc')}</Text>
                <Text style={styles.detailValue}>{event.address}</Text>
                <Text style={styles.detailHint}>{event.place}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="calendar-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>{t('detailLblDate')}</Text>
                <Text style={styles.detailValue}>{event.fullDate}</Text>
                <Text style={styles.detailHint}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Ionicons name="musical-notes-outline" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>{t('detailLblMusic')}</Text>
                <Text style={styles.detailValue}>{event.vibe}</Text>
                <Text style={styles.detailHint}>{event.experience}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <MaterialCommunityIcons name="currency-eur" size={18} color={Colors.light.tint} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>{t('detailLblPrice')}</Text>
                <Text style={styles.detailValue}>{event.priceLabel}</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/likes',
                      params: { eventId: event.id },
                    })
                  }>
                  <Text style={styles.detailHint}>{social?.likes.length ?? 0} {t('detailPeopleLiked')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.hostCard} variant="feature">
            <View style={styles.hostRow}>
              <AppImage source={{ uri: event.hostAvatar }} style={styles.hostAvatar} contentFit="cover" />
              <View style={styles.hostCopy}>
                <Text style={styles.hostLabel}>{t('detailHostLabel')}</Text>
                <Text style={styles.hostName}>{event.hostName}</Text>
              </View>
              <AppButton label={t('detailFollowBtn')} variant="secondary" style={styles.followBtn} />
            </View>
          </SurfaceCard>
        </View>
      </ScrollView>

      <View style={[styles.bottomWrap, { bottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomCard}>
          <View>
            <Text style={styles.bottomPrice}>{event.price}</Text>
            <Text style={styles.bottomPriceMeta}>{t('detailPerTicket')}</Text>
          </View>

          <AppButton
            label={t('detailGetTicket')}
            style={styles.buyButton}
            onPress={() => {
              void handleOpenTickets();
            }}
            disabled={!event.sourceUrl}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.events.background },
  missingWrap: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  heroWrap: { height: 430, marginBottom: -26 },
  hero: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 42,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topActions: { flexDirection: 'row', gap: 10 },
  heroContent: { gap: 12 },
  liveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#fff7ef', fontSize: 34, fontWeight: '800', lineHeight: 38, maxWidth: 300 },
  subtitle: { color: '#eadccf', fontSize: 15, lineHeight: 22, maxWidth: 320 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  body: { paddingHorizontal: Layout.screenPadding, gap: Layout.sectionGap },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { gap: 12 },
  sectionTitle: { color: '#1f1a17', fontSize: 22, fontWeight: '800' },
  description: { color: '#6f655e', lineHeight: 22, fontSize: 14.5 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff3e6',
    borderRadius: Radius.round,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  socialButtonText: { color: '#1f1a17', fontWeight: '700', fontSize: 12.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  tag: { backgroundColor: '#f2e4d5', borderRadius: Radius.round, paddingHorizontal: 12, paddingVertical: 8 },
  tagText: { color: '#4b4038', fontWeight: '700', fontSize: 12.5 },
  plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  plannerText: { color: '#6f655e', lineHeight: 20, marginTop: 6, maxWidth: 250 },
  plannerLink: { color: Colors.light.tint, fontWeight: '800', marginTop: 4 },
  planActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  planActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fff1e0',
    borderRadius: Radius.round,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  planActionChipActive: {
    backgroundColor: '#231b17',
  },
  planActionText: { color: Colors.light.tint, fontWeight: '800', fontSize: 12.5 },
  planActionTextActive: { color: '#fff7ef' },
  plannerNote: { color: '#7a6f67', lineHeight: 20, marginTop: 2 },
  detailRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#f6efe6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: { flex: 1, gap: 2 },
  detailLabel: { color: '#7b7068', fontSize: 12.5, fontWeight: '700' },
  detailValue: { color: '#1f1a17', fontSize: 16, fontWeight: '800', lineHeight: 21 },
  detailHint: { color: '#8d8178', fontSize: 13 },
  hostCard: {
    backgroundColor: '#231b17',
  },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatar: { width: 54, height: 54, borderRadius: 27 },
  hostCopy: { flex: 1 },
  hostLabel: { color: '#d4c4b7', fontSize: 12 },
  hostName: { color: '#fff7ef', fontSize: 17, fontWeight: '800', marginTop: 2 },
  followBtn: { minWidth: 92 },
  bottomWrap: { position: 'absolute', left: 16, right: 16 },
  bottomCard: {
    backgroundColor: 'rgba(255,250,245,0.98)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bottomPrice: { color: '#1f1a17', fontSize: 20, fontWeight: '800' },
  bottomPriceMeta: { color: '#7b7068', marginTop: 2 },
  buyButton: { minWidth: 140 },
});
