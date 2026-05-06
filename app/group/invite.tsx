import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { getFriends, type FriendListItem } from '@/services/friendsApi';
import { getGroup, inviteGroupMembers } from '@/services/groupsApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupInviteScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setError('Group not found.');
      setIsLoading(false);
      return;
    }

    void Promise.all([getFriends(), getGroup(groupId)])
      .then(([friendList, group]) => {
        setFriends(friendList);
        setMemberIds(new Set(group.members.map((member) => member.user.id)));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load this invite list right now.'))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  const inviteableFriends = useMemo(
    () => friends.filter((entry) => !memberIds.has(entry.friend.id)),
    [friends, memberIds]
  );

  const toggleSelection = (userId: string) => {
    setSelectedIds((current) => (current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]));
  };

  const handleInvite = async () => {
    if (!groupId || !selectedIds.length) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await inviteGroupMembers(groupId, selectedIds);
      showToast({
        tone: 'success',
        title: t('groupsTitle'),
        message: 'Invites sent.',
      });
      router.replace({ pathname: '/group/[id]', params: { id: groupId } });
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to send invites right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('groupsEyebrow')}
          title={t('groupsInviteTitle')}
          subtitle={t('groupsInviteSubtitle')}
          onBack={() => router.back()}
          mode="compact"
        />

        {error ? <FeedbackBanner tone="error" title={t('groupsTitle')} message={error} /> : null}

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('groupsInviteFriendsLabel')}</Text>

          {isLoading ? (
            <Text style={styles.emptyInline}>Loading...</Text>
          ) : inviteableFriends.length ? (
            <View style={styles.stack}>
              {inviteableFriends.map((entry) => {
                const selected = selectedIds.includes(entry.friend.id);
                return (
                  <TouchableOpacity
                    key={entry.friendship_id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    style={[styles.friendRow, selected && styles.friendRowSelected]}
                    onPress={() => toggleSelection(entry.friend.id)}>
                    {entry.friend.avatar_uri ? (
                      <AppImage source={{ uri: entry.friend.avatar_uri }} style={styles.avatar} contentFit="cover" />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>{entry.friend.username.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.friendCopy}>
                      <Text style={styles.friendTitle}>{entry.friend.full_name || entry.friend.username}</Text>
                      <Text style={styles.friendMeta}>@{entry.friend.username}</Text>
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="people-outline" title={t('friendsEmptyTitle')} message={t('groupsNoFriendsToInvite')} />
          )}

          <AppButton
            label={isSubmitting ? t('groupsInviteSubmitting') : t('groupsInviteSubmit')}
            disabled={!selectedIds.length || isSubmitting}
            onPress={() => void handleInvite()}
          />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: Layout.screenPadding, gap: Layout.sectionGap, paddingBottom: Layout.bottomPad },
  sectionCard: { gap: 16 },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
  },
  stack: { gap: 10 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    backgroundColor: '#fff',
  },
  friendRowSelected: {
    borderColor: '#f0bb8a',
    backgroundColor: '#fff8f1',
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
  friendCopy: { flex: 1 },
  friendTitle: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 15,
  },
  friendMeta: {
    color: Colors.light.subtitle,
    marginTop: 4,
    fontSize: 12.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.borderStrong,
  },
  checkboxSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint,
  },
  emptyInline: {
    color: Colors.light.subtitle,
    fontSize: 13.5,
  },
});
