import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  type FriendListItem,
  type FriendRequestItem,
  type FriendUser,
  type UserSearchResult,
} from '@/services/friendsApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getDisplayName(user: FriendUser) {
  return user.full_name?.trim() || user.username;
}

function UserAvatar({ user }: { user: FriendUser }) {
  if (user.avatar_uri) {
    return <AppImage source={{ uri: user.avatar_uri }} style={styles.avatar} contentFit="cover" />;
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{user.username.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isActing, setIsActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const friendIds = useMemo(() => new Set(friends.map((entry) => entry.friend.id)), [friends]);

  const loadData = async () => {
    setError(null);
    try {
      const [friendList, requestList] = await Promise.all([getFriends(), getFriendRequests()]);
      setFriends(friendList);
      setIncomingRequests(requestList.incoming);
      setOutgoingRequests(requestList.outgoing);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load friends right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setError(t('friendsSearchTooShort'));
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      setSearchResults(await searchUsers(trimmed));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Unable to search users right now.');
    } finally {
      setIsSearching(false);
    }
  };

  const runAction = async (actionKey: string, action: () => Promise<void>) => {
    setIsActing(actionKey);
    try {
      await action();
      await loadData();
      if (query.trim().length >= 2) {
        setSearchResults(await searchUsers(query.trim()));
      }
    } catch (actionError) {
      showToast({
        tone: 'error',
        title: t('friendsTitle'),
        message: actionError instanceof Error ? actionError.message : 'Unable to update this friendship right now.',
      });
    } finally {
      setIsActing(null);
    }
  };

  const renderSearchAction = (item: UserSearchResult) => {
    if (friendIds.has(item.id) || item.friendship_status === 'accepted') {
      return (
        <AppButton
          label={t('friendsActionRemove')}
          variant="secondary"
          disabled={isActing === `remove-${item.id}`}
          onPress={() => void runAction(`remove-${item.id}`, () => removeFriend(item.id))}
        />
      );
    }

    if (item.friendship_status === 'incoming_pending') {
      const request = incomingRequests.find((entry) => entry.requester_user.id === item.id);
      return (
        <View style={styles.inlineActions}>
          <AppButton
            label={t('friendsActionAccept')}
            disabled={!request || isActing === `accept-${item.id}`}
            onPress={() =>
              request ? void runAction(`accept-${item.id}`, () => acceptFriendRequest(request.id).then(() => {})) : undefined
            }
          />
          <AppButton
            label={t('friendsActionDecline')}
            variant="secondary"
            disabled={!request || isActing === `decline-${item.id}`}
            onPress={() =>
              request ? void runAction(`decline-${item.id}`, () => declineFriendRequest(request.id).then(() => {})) : undefined
            }
          />
        </View>
      );
    }

    if (item.friendship_status === 'outgoing_pending') {
      return <Text style={styles.statusPill}>{t('friendsStatusOutgoing')}</Text>;
    }

    return (
      <AppButton
        label={t('friendsActionAdd')}
        disabled={isActing === `add-${item.id}`}
        onPress={() => void runAction(`add-${item.id}`, () => sendFriendRequest(item.id).then(() => {}))}
      />
    );
  };

  const openPublicProfile = (userId: string) => {
    router.push({ pathname: '/profile/[id]', params: { id: userId } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('friendsEyebrow')}
          title={t('friendsTitle')}
          subtitle={t('friendsSubtitle')}
          onBack={() => router.back()}
          mode="compact"
        />

        <SurfaceCard style={styles.sectionCard} variant="subtle">
          <Text style={styles.sectionTitle}>{t('friendsSearchLabel')}</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder={t('friendsSearchPlaceholder')}
              placeholderTextColor="#91867f"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => void handleSearch()}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('friendsSearchButton')}
              style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
              disabled={isSearching}
              onPress={() => void handleSearch()}>
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {error ? <FeedbackBanner tone="error" title={t('friendsTitle')} message={error} /> : null}

          {searchResults.length ? (
            <View style={styles.stack}>
              {searchResults.map((item) => (
                <SurfaceCard key={item.id} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <UserAvatar user={item} />
                    <View style={styles.userCopy}>
                      <Text style={styles.userTitle}>{getDisplayName(item)}</Text>
                      <Text style={styles.userMeta}>@{item.username} · {item.crown_count} {t('friendsStatCrowns')}</Text>
                    </View>
                  </View>
                  {renderSearchAction(item)}
                </SurfaceCard>
              ))}
            </View>
          ) : query.trim().length >= 2 && !isSearching ? (
            <Text style={styles.emptyInline}>{t('friendsSearchEmpty')}</Text>
          ) : null}
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('friendsRequestsTitle')}</Text>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>{t('friendsIncomingTitle')}</Text>
            {incomingRequests.length ? (
              incomingRequests.map((request) => (
                <SurfaceCard key={request.id} style={styles.requestCard} variant="subtle">
                  <View style={styles.userRow}>
                    <UserAvatar user={request.requester_user} />
                    <View style={styles.userCopy}>
                      <Text style={styles.userTitle}>{getDisplayName(request.requester_user)}</Text>
                      <Text style={styles.userMeta}>@{request.requester_user.username}</Text>
                    </View>
                  </View>
                  <View style={styles.inlineActions}>
                    <AppButton
                      label={t('friendsActionAccept')}
                      disabled={isActing === `accept-${request.id}`}
                      onPress={() => void runAction(`accept-${request.id}`, () => acceptFriendRequest(request.id).then(() => {}))}
                    />
                    <AppButton
                      label={t('friendsActionDecline')}
                      variant="secondary"
                      disabled={isActing === `decline-${request.id}`}
                      onPress={() => void runAction(`decline-${request.id}`, () => declineFriendRequest(request.id).then(() => {}))}
                    />
                  </View>
                </SurfaceCard>
              ))
            ) : (
              <Text style={styles.emptyInline}>{t('friendsSearchEmpty')}</Text>
            )}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>{t('friendsOutgoingTitle')}</Text>
            {outgoingRequests.length ? (
              outgoingRequests.map((request) => (
                <SurfaceCard key={request.id} style={styles.requestCard} variant="subtle">
                  <View style={styles.userRow}>
                    <UserAvatar user={request.addressee_user} />
                    <View style={styles.userCopy}>
                      <Text style={styles.userTitle}>{getDisplayName(request.addressee_user)}</Text>
                      <Text style={styles.userMeta}>@{request.addressee_user.username}</Text>
                    </View>
                  </View>
                  <Text style={styles.statusPill}>{t('friendsStatusOutgoing')}</Text>
                </SurfaceCard>
              ))
            ) : (
              <Text style={styles.emptyInline}>{t('friendsSearchEmpty')}</Text>
            )}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('friendsListTitle')}</Text>

          {isLoading ? (
            <Text style={styles.emptyInline}>Loading...</Text>
          ) : friends.length ? (
            <View style={styles.stack}>
              {friends.map((entry) => (
                <SurfaceCard key={entry.friendship_id} style={styles.userCard} variant="subtle">
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={getDisplayName(entry.friend)}
                    activeOpacity={0.88}
                    style={styles.userRow}
                    onPress={() => openPublicProfile(entry.friend.id)}>
                    <UserAvatar user={entry.friend} />
                    <View style={styles.userCopy}>
                      <Text style={styles.userTitle}>{getDisplayName(entry.friend)}</Text>
                      <Text style={styles.userMeta}>@{entry.friend.username} · {entry.friend.crown_count} {t('friendsStatCrowns')}</Text>
                    </View>
                  </TouchableOpacity>
                  <AppButton
                    label={t('friendsActionRemove')}
                    variant="secondary"
                    disabled={isActing === `remove-${entry.friend.id}`}
                    onPress={() => void runAction(`remove-${entry.friend.id}`, () => removeFriend(entry.friend.id))}
                  />
                </SurfaceCard>
              ))}
            </View>
          ) : (
            <EmptyState icon="people-outline" title={t('friendsEmptyTitle')} message={t('friendsEmptyMsg')} />
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
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.title,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: { opacity: 0.6 },
  stack: { gap: 10 },
  subsection: { gap: 10 },
  subsectionTitle: {
    ...Typography.caption,
    color: Colors.light.subtitle,
    textTransform: 'uppercase',
  },
  userCard: {
    gap: 12,
  },
  requestCard: {
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.cardFeature,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 18,
  },
  userCopy: { flex: 1 },
  userTitle: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 16,
  },
  userMeta: {
    color: Colors.light.subtitle,
    fontSize: 12.5,
    marginTop: 4,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.round,
    backgroundColor: '#fff1e0',
    color: Colors.light.tint,
    fontWeight: '800',
    fontSize: 12.5,
  },
  emptyInline: {
    color: Colors.light.subtitle,
    fontSize: 13.5,
  },
});
