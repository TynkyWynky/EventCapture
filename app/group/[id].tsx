import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import type { TranslationKey } from '@/constants/translations';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import {
  acceptGroupInvite,
  declineGroupInvite,
  deleteOrArchiveGroup,
  getGroup,
  getGroupLeaderboard,
  leaveGroup,
  removeGroupMember,
  updateGroupMemberRole,
  type GroupDetail,
  type GroupLeaderboardResponse,
  type GroupMember,
} from '@/services/groupsApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type LeaderboardPeriod = 'all_time' | 'weekly' | 'monthly';

function roleLabel(role: string, t: (key: TranslationKey) => string) {
  if (role === 'owner') return t('groupsRoleOwner');
  if (role === 'admin') return t('groupsRoleAdmin');
  return t('groupsRoleMember');
}

function memberStatusLabel(status: string, t: (key: TranslationKey) => string) {
  if (status === 'accepted') return t('groupsMemberAccepted');
  if (status === 'invited') return t('groupsMemberInvited');
  return t('groupsMemberDeclined');
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<GroupLeaderboardResponse | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canInvite = group?.current_user_status === 'accepted' && ['owner', 'admin'].includes(group.current_user_role);
  const canManageMembers = group?.current_user_status === 'accepted' && ['owner', 'admin'].includes(group.current_user_role);

  const loadGroup = useCallback(async (selectedPeriod: LeaderboardPeriod = period) => {
    if (!id) {
      setError('Group not found.');
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const nextGroup = await getGroup(id);
      setGroup(nextGroup);
      if (nextGroup.current_user_status === 'accepted') {
        setLeaderboard(await getGroupLeaderboard(id, selectedPeriod));
      } else {
        setLeaderboard(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this group right now.');
    } finally {
      setIsLoading(false);
    }
  }, [id, period]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const runAction = async (actionKey: string, action: () => Promise<void>, onSuccess?: () => void) => {
    setIsActing(actionKey);
    try {
      await action();
      await loadGroup();
      onSuccess?.();
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

  const periodOptions = useMemo(
    () => [
      { key: 'all_time' as const, label: t('groupsLeaderboardAllTime') },
      { key: 'weekly' as const, label: t('groupsLeaderboardWeekly') },
      { key: 'monthly' as const, label: t('groupsLeaderboardMonthly') },
    ],
    [t]
  );

  const handlePeriodChange = async (nextPeriod: LeaderboardPeriod) => {
    setPeriod(nextPeriod);
    setIsActing(`period-${nextPeriod}`);
    try {
      setLeaderboard(await getGroupLeaderboard(id, nextPeriod));
    } catch (periodError) {
      showToast({
        tone: 'error',
        title: t('groupsDetailLeaderboardTitle'),
        message: periodError instanceof Error ? periodError.message : 'Unable to load this leaderboard right now.',
      });
    } finally {
      setIsActing(null);
    }
  };

  const renderMemberActions = (member: GroupMember) => {
    if (!group || member.user.id === user.id || !canManageMembers || member.status !== 'accepted') {
      return null;
    }

    if (group.current_user_role === 'owner' && member.role !== 'owner') {
      return (
        <View style={styles.memberActions}>
          <AppButton
            label={member.role === 'admin' ? t('groupsActionDemote') : t('groupsActionPromote')}
            variant="secondary"
            onPress={() =>
              void runAction(
                `role-${member.id}`,
                () => updateGroupMemberRole(group.id, member.user.id, member.role === 'admin' ? 'member' : 'admin').then(() => {})
              )
            }
          />
          <AppButton
            label={t('groupsActionRemoveMember')}
            variant="danger"
            onPress={() => void runAction(`remove-${member.id}`, () => removeGroupMember(group.id, member.user.id))}
          />
        </View>
      );
    }

    if (group.current_user_role === 'admin' && member.role === 'member') {
      return (
        <AppButton
          label={t('groupsActionRemoveMember')}
          variant="danger"
          onPress={() => void runAction(`remove-${member.id}`, () => removeGroupMember(group.id, member.user.id))}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('groupsEyebrow')}
          title={group?.name ?? t('groupsTitle')}
          subtitle={group?.description || t('groupsSubtitle')}
          onBack={() => router.back()}
          mode="compact"
          rightAction={
            canInvite && group ? (
              <AppButton
                label={t('groupsActionInvite')}
                variant="secondary"
                onPress={() => router.push({ pathname: '/group/invite', params: { groupId: group.id } })}
              />
            ) : undefined
          }
        />

        {error ? <FeedbackBanner tone="error" title={t('groupsTitle')} message={error} /> : null}

        {isLoading ? (
          <SurfaceCard style={styles.sectionCard}>
            <Text style={styles.emptyInline}>{t('groupsLoading')}</Text>
          </SurfaceCard>
        ) : null}

        {group?.current_user_status === 'invited' ? (
          <SurfaceCard style={styles.sectionCard} variant="feature">
            <Text style={styles.sectionTitle}>{t('groupsInvitesTitle')}</Text>
            <Text style={styles.description}>{group.description || t('groupsSubtitle')}</Text>
            <View style={styles.inlineActions}>
              <AppButton
                label={t('groupsActionAcceptInvite')}
                disabled={isActing === 'accept-invite'}
                onPress={() => void runAction('accept-invite', () => acceptGroupInvite(group.id).then(() => {}))}
              />
              <AppButton
                label={t('groupsActionDeclineInvite')}
                variant="secondary"
                disabled={isActing === 'decline-invite'}
                onPress={() =>
                  void runAction('decline-invite', () => declineGroupInvite(group.id), () => {
                    router.replace('/groups');
                  })
                }
              />
            </View>
          </SurfaceCard>
        ) : null}

        {group ? (
          <>
            <SurfaceCard style={styles.sectionCard} variant="subtle">
              <Text style={styles.sectionTitle}>{t('groupsDetailAboutTitle')}</Text>
              <Text style={styles.description}>{group.description || t('groupsEmptyMsg')}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{roleLabel(group.current_user_role, t)}</Text>
                <Text style={styles.metaText}>{group.member_count} {t('groupsMembersCount')}</Text>
              </View>
            </SurfaceCard>

            {group.current_user_status === 'accepted' ? (
              <SurfaceCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('groupsDetailLeaderboardTitle')}</Text>
                  <View style={styles.periodRow}>
                    {periodOptions.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        accessibilityRole="button"
                        accessibilityLabel={option.label}
                        style={[styles.periodPill, period === option.key && styles.periodPillActive]}
                        onPress={() => void handlePeriodChange(option.key)}>
                        <Text style={[styles.periodText, period === option.key && styles.periodTextActive]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {leaderboard?.entries.length ? (
                  <View style={styles.stack}>
                    {leaderboard.entries.map((entry) => (
                      <View key={`${entry.user_id}-${entry.rank}`} style={[styles.leaderboardRow, entry.is_current_user && styles.leaderboardRowCurrent]}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankText}>{entry.rank}</Text>
                        </View>
                        {entry.avatar_url ? (
                          <AppImage source={{ uri: entry.avatar_url }} style={styles.avatar} contentFit="cover" />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Text style={styles.avatarFallbackText}>{entry.display_name.charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={styles.leaderboardCopy}>
                          <Text style={styles.userTitle}>
                            {entry.display_name} {entry.is_current_user ? `· ${t('groupsBadgeYou')}` : ''}
                          </Text>
                          <Text style={styles.userMeta}>
                            {entry.crown_count} {t('groupsCrownsLabel')} · {entry.period_crowns} {t('groupsPeriodLabel')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState icon="trophy-outline" title={t('groupsDetailLeaderboardTitle')} message={t('groupsLeaderboardEmpty')} />
                )}
              </SurfaceCard>
            ) : null}

            <SurfaceCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t('groupsDetailMembersTitle')}</Text>
              <View style={styles.stack}>
                {group.members.map((member) => (
                  <SurfaceCard key={member.id} style={styles.memberCard} variant="subtle">
                    <View style={styles.userRow}>
                      {member.user.avatar_uri ? (
                        <AppImage source={{ uri: member.user.avatar_uri }} style={styles.avatar} contentFit="cover" />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>{member.user.username.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.userCopy}>
                        <Text style={styles.userTitle}>
                          {member.user.full_name || member.user.username} {member.user.id === user.id ? `· ${t('groupsBadgeYou')}` : ''}
                        </Text>
                        <Text style={styles.userMeta}>
                          @{member.user.username} · {roleLabel(member.role, t)} · {memberStatusLabel(member.status, t)}
                        </Text>
                      </View>
                    </View>
                    {renderMemberActions(member)}
                  </SurfaceCard>
                ))}
              </View>
            </SurfaceCard>

            <SurfaceCard style={styles.sectionCard}>
              <View style={styles.inlineActions}>
                {group.current_user_role === 'owner' ? (
                  <AppButton
                    label={t('groupsActionArchive')}
                    variant="danger"
                    disabled={isActing === 'archive'}
                    onPress={() =>
                      void runAction('archive', () => deleteOrArchiveGroup(group.id), () => {
                        router.replace('/groups');
                      })
                    }
                  />
                ) : null}
                {group.current_user_status === 'accepted' ? (
                  <AppButton
                    label={t('groupsActionLeave')}
                    variant="secondary"
                    disabled={isActing === 'leave'}
                    onPress={() =>
                      void runAction('leave', () => leaveGroup(group.id, user.id), () => {
                        router.replace('/groups');
                      })
                    }
                  />
                ) : null}
              </View>
            </SurfaceCard>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, gap: Layout.sectionGap, paddingBottom: Layout.bottomPad },
  sectionCard: { gap: 14 },
  sectionHeader: {
    gap: 12,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
  },
  description: {
    color: '#5d5149',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaText: {
    color: Colors.light.subtitle,
    fontWeight: '700',
    fontSize: 12.5,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodPill: {
    borderRadius: Radius.round,
    backgroundColor: Colors.light.cardFeature,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodPillActive: {
    backgroundColor: '#fff1e0',
  },
  periodText: {
    color: Colors.light.subtitle,
    fontWeight: '700',
    fontSize: 12,
  },
  periodTextActive: {
    color: Colors.light.tint,
  },
  stack: { gap: 10 },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  leaderboardRowCurrent: {
    borderColor: '#f0bb8a',
    backgroundColor: '#fff8f1',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f1a17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: '800',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.cardFeature,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 16,
  },
  leaderboardCopy: { flex: 1 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userCopy: { flex: 1 },
  userTitle: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 15,
  },
  userMeta: {
    color: Colors.light.subtitle,
    marginTop: 4,
    fontSize: 12.5,
  },
  memberCard: {
    gap: 12,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  emptyInline: {
    color: Colors.light.subtitle,
    fontSize: 13.5,
  },
});
