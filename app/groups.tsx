import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import {
  acceptGroupInvite,
  declineGroupInvite,
  getGroups,
  type GroupListResponse,
  type GroupSummary,
} from '@/services/groupsApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function GroupCard({
  item,
  onOpen,
  membersLabel,
  openLabel,
}: {
  item: GroupSummary;
  onOpen: () => void;
  membersLabel: string;
  openLabel: string;
}) {
  return (
    <SurfaceCard style={styles.groupCard} variant="subtle">
      <View style={styles.groupIcon}>
        <Ionicons name="people-outline" size={22} color={Colors.light.tint} />
      </View>
      <View style={styles.groupCopy}>
        <Text style={styles.groupTitle}>{item.name}</Text>
        <Text style={styles.groupMeta}>
          {item.member_count} {membersLabel} · {item.membership_role}
        </Text>
        {item.description ? <Text style={styles.groupDescription}>{item.description}</Text> : null}
      </View>
      <AppButton label={openLabel} variant="secondary" onPress={onOpen} />
    </SurfaceCard>
  );
}

export default function GroupsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<GroupListResponse>({ items: [], pending_invites: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    setError(null);
    try {
      setGroups(await getGroups());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load groups right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const runAction = async (actionKey: string, action: () => Promise<void>) => {
    setIsActing(actionKey);
    try {
      await action();
      await loadGroups();
    } catch (actionError) {
      showToast({
        tone: 'error',
        title: t('groupsTitle'),
        message: actionError instanceof Error ? actionError.message : 'Unable to update this group right now.',
      });
    } finally {
      setIsActing(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('groupsEyebrow')}
          title={t('groupsTitle')}
          subtitle={t('groupsSubtitle')}
          onBack={() => router.back()}
          mode="compact"
          rightAction={<AppButton label={t('groupsCreateCta')} variant="secondary" onPress={() => router.push('/group/create')} />}
        />

        {error ? <FeedbackBanner tone="error" title={t('groupsTitle')} message={error} /> : null}

        <SurfaceCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('groupsInvitesTitle')}</Text>
          </View>

          {groups.pending_invites.length ? (
            <View style={styles.stack}>
              {groups.pending_invites.map((item) => (
                <SurfaceCard key={item.id} style={styles.inviteCard} variant="subtle">
                  <View style={styles.groupCopy}>
                    <Text style={styles.groupTitle}>{item.name}</Text>
                    <Text style={styles.groupMeta}>{item.member_count} {t('groupsMembersCount')}</Text>
                    {item.description ? <Text style={styles.groupDescription}>{item.description}</Text> : null}
                  </View>
                  <View style={styles.inlineActions}>
                    <AppButton
                      label={t('groupsActionAcceptInvite')}
                      disabled={isActing === `accept-${item.id}`}
                      onPress={() => void runAction(`accept-${item.id}`, () => acceptGroupInvite(item.id).then(() => {}))}
                    />
                    <AppButton
                      label={t('groupsActionDeclineInvite')}
                      variant="secondary"
                      disabled={isActing === `decline-${item.id}`}
                      onPress={() => void runAction(`decline-${item.id}`, () => declineGroupInvite(item.id))}
                    />
                  </View>
                </SurfaceCard>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyInline}>{t('groupsNoInvites')}</Text>
          )}
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('groupsListTitle')}</Text>

          {isLoading ? (
            <Text style={styles.emptyInline}>{t('groupsLoading')}</Text>
          ) : groups.items.length ? (
            <View style={styles.stack}>
              {groups.items.map((item) => (
                <GroupCard
                  key={item.id}
                  item={item}
                  membersLabel={t('groupsMembersCount')}
                  openLabel={t('groupsOpenLabel')}
                  onOpen={() => router.push({ pathname: '/group/[id]', params: { id: item.id } })}
                />
              ))}
            </View>
          ) : (
            <EmptyState icon="people-circle-outline" title={t('groupsEmptyTitle')} message={t('groupsEmptyMsg')} />
          )}
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, gap: Layout.sectionGap, paddingBottom: Layout.bottomPad },
  sectionCard: { gap: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
  },
  stack: { gap: 10 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteCard: { gap: 12 },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: '#fff1e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCopy: { flex: 1 },
  groupTitle: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 16,
  },
  groupMeta: {
    color: Colors.light.subtitle,
    fontSize: 12.5,
    marginTop: 4,
  },
  groupDescription: {
    color: '#5d5149',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyInline: {
    color: Colors.light.subtitle,
    fontSize: 13.5,
  },
});
