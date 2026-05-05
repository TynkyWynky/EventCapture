import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { Colors, Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { usePosts } from '@/context/PostContext';
import { useEvents } from '@/context/EventContext';
import type { Post } from '@/constants/posts';
import { useUser } from '@/context/UserContext';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { useLanguage } from '@/context/LanguageContext';

export default function SocialFeedScreen() {
  const router = useRouter();
  const { posts, togglePostLike, refreshPosts, isOffline, isUsingCachedData, error } = usePosts();
  const { events } = useEvents();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshPosts();
    } catch {
      // Keep the existing feed visible when refresh fails.
    } finally {
      setRefreshing(false);
    }
  }, [refreshPosts]);

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes.includes(user.username);
    const linkedEvent = item.eventId ? eventMap.get(item.eventId) : undefined;
    const storyText = item.isBeerFinished ? t('socialStoryEligible') : t('socialStoryShared');

    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <View style={styles.userRow}>
            {item.user?.avatarUri ? (
              <AppImage source={{ uri: item.user.avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#aaa" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.user?.username || 'user'}</Text>
              <Text style={styles.storyLine}>
                {storyText}
                {item.eventTitle ? ` ${t('socialStoryAt')} ${item.eventTitle}` : ''}
              </Text>
            </View>
          </View>

          {item.isBeerFinished ? (
            <View style={styles.headerBadge}>
              <Ionicons name="ribbon" size={12} color="#fff" />
              <Text style={styles.headerBadgeText}>{t('socialCrownBadge')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.mediaContainer}>
          <AppImage source={{ uri: item.imageUri }} style={styles.media} contentFit="cover" />
          {item.captureId ? (
            <View style={styles.captureBadge}>
              <Text style={styles.captureBadgeText}>{t('socialCaptureSavedLabel')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.contextBlock}>
          {item.eventTitle ? (
            <View style={styles.contextRow}>
              <Ionicons name="calendar-outline" size={15} color={Colors.light.tint} />
              <Text style={styles.contextText}>{item.eventTitle}</Text>
            </View>
          ) : null}
          {linkedEvent?.place ? (
            <View style={styles.contextRow}>
              <Ionicons name="pin-outline" size={15} color={Colors.light.tint} />
              <Text style={styles.contextText}>{linkedEvent.place}</Text>
            </View>
          ) : null}
          <View style={styles.contextRow}>
            <Ionicons name="time-outline" size={15} color={Colors.light.tint} />
            <Text style={styles.contextText}>{item.date}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
              onPress={() => togglePostLike(item.id)}
              style={styles.actionButton}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#e11d48' : '#1f1a17'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('socialCommentCta')}
              onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}
              style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color="#1f1a17" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('socialCommentCta')}
            style={styles.commentCta}
            onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}>
            <Text style={styles.commentCtaText}>{t('socialCommentCta')}</Text>
          </TouchableOpacity>
        </View>

        {item.likes.length > 0 ? (
          <Text style={styles.likesText}>
            {item.likes.length}
            {item.likes.length !== 1 ? t('socialLikesPlural') : t('socialLikesSingular')}
          </Text>
        ) : null}

        <View style={styles.captionRow}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{item.user?.username || 'user'} </Text>
            {item.eventTitle ? `${t('socialCaptionWithEvent')} ${item.eventTitle}` : t('socialCaptionWithoutEvent')}
          </Text>
        </View>

        {item.comments.length > 0 ? (
          <TouchableOpacity onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}>
            <Text style={styles.viewCommentsText}>
              {t('socialViewAll')} {item.comments.length}{' '}
              {item.comments.length !== 1 ? t('socialCommentsPlural') : t('socialCommentsSingular')}
            </Text>
            <Text style={styles.previewComment}>
              <Text style={styles.previewCommentUser}>{item.comments[0]?.user.username}</Text> {item.comments[0]?.text}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}>
            <Text style={styles.viewCommentsText}>{t('socialAddComment')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow="EventCapture"
          title={t('socialTab')}
          subtitle={t('socialFeedSubtitle')}
          leading={
            <View style={styles.headerBadgeWrap}>
              <Ionicons name="images-outline" size={20} color={TabThemes.socialfeed.accent} />
            </View>
          }
          mode="compact"
          rightAction={
            <View style={styles.headerActions}>
              <IconActionButton
                icon="notifications-outline"
                accessibilityLabel={t('notifTitle')}
                onPress={() => router.push('/notifications')}
              />
              <IconActionButton icon="menu" accessibilityLabel={t('menuTitle')} onPress={() => router.push('/menu')} />
            </View>
          }
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={
          <>
            {isOffline || isUsingCachedData ? (
              <View style={styles.bannerWrap}>
                <FeedbackBanner
                  tone={isOffline ? 'error' : 'info'}
                  title={isOffline ? 'Feed updates are unavailable' : 'Showing cached posts'}
                  message={error ?? 'Reconnect to refresh the latest social activity.'}
                />
              </View>
            ) : null}

            {!posts.length ? (
              <View style={styles.emptyWrap}>
                <EmptyState icon="images-outline" title={t('socialEmptyTitle')} message={t('socialEmptyMsg')} />
                <View style={styles.emptyActions}>
                  <AppButton label={t('socialActionCapture')} onPress={() => router.push('/camera')} />
                  <AppButton label={t('socialActionEvents')} variant="secondary" onPress={() => router.push('/events')} />
                </View>
              </View>
            ) : null}
          </>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 120) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.tint} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TabThemes.socialfeed.background },
  headerWrap: {
    paddingHorizontal: Layout.screenPadding,
    marginTop: 8,
  },
  headerBadgeWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: '#fff3ef',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f4d9d1',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listContent: {
    paddingTop: 14,
  },
  bannerWrap: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 14,
  },
  emptyWrap: {
    paddingHorizontal: Layout.screenPadding,
    gap: 14,
    paddingBottom: 14,
  },
  emptyActions: {
    gap: 10,
  },
  separator: {
    height: 18,
  },
  postContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: Layout.screenPadding,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0e3dc',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, gap: 2 },
  username: { fontWeight: '800', fontSize: 14, color: '#1f1a17' },
  storyLine: { fontSize: 12.5, color: '#8e6d63', lineHeight: 17 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#0f766e',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  headerBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11.5 },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#f3efeb',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  captureBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(31,26,23,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  captureBadgeText: { color: '#fff7ef', fontWeight: '700', fontSize: 11.5 },
  contextBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: 8,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contextText: {
    color: '#5d5149',
    fontSize: 12.5,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionButton: { padding: 2 },
  commentCta: {
    borderRadius: 999,
    backgroundColor: '#fff1e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentCtaText: { color: Colors.light.tint, fontWeight: '800', fontSize: 12.5 },
  likesText: {
    paddingHorizontal: Spacing.lg,
    fontWeight: '700',
    fontSize: 14,
    color: '#1f1a17',
    marginBottom: 6,
  },
  captionRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  captionText: {
    fontSize: 14,
    color: '#1f1a17',
    lineHeight: 21,
  },
  captionUsername: { fontWeight: '700' },
  viewCommentsText: {
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
    color: '#81776f',
    marginBottom: 4,
  },
  previewComment: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    fontSize: 13,
    color: '#4d433d',
    lineHeight: 19,
  },
  previewCommentUser: { fontWeight: '800' },
});
