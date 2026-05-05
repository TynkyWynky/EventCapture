import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppImage } from '@/components/ui/app-image';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Colors, Layout, Radius, Spacing, TabThemes } from '@/constants/theme';
import { usePosts } from '@/context/PostContext';
import type { Post } from '@/constants/posts';
import { useUser } from '@/context/UserContext';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';

export default function SocialFeedScreen() {
  const router = useRouter();
  const { posts, togglePostLike } = usePosts();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes.includes(user.username);

    return (
      <View style={styles.postContainer}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.userRow}>
            {item.user?.avatarUri ? (
              <AppImage source={{ uri: item.user.avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#aaa" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.user?.username || 'user'}</Text>
              {item.eventTitle ? (
                <Text style={styles.locationText}>{item.eventTitle}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#81776f" />
          </TouchableOpacity>
        </View>

        {/* Media */}
        <View style={styles.mediaContainer}>
          <AppImage source={{ uri: item.imageUri }} style={styles.media} contentFit="cover" />
          {item.isBeerFinished ? (
            <View style={styles.crownBadge}>
              <LinearGradient colors={[Colors.light.tint, Colors.light.tintDark]} style={styles.crownGradient}>
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={styles.crownText}>{t('socialCrownBadge')}</Text>
              </LinearGradient>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <View style={styles.actionLeft}>
            <TouchableOpacity onPress={() => togglePostLike(item.id)} style={styles.actionButton}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={26} 
                color={isLiked ? "#e11d48" : "#1f1a17"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })} 
              style={styles.actionButton}
            >
              <Ionicons name="chatbubble-outline" size={24} color="#1f1a17" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={24} color="#1f1a17" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionRight}>
            <Ionicons name="bookmark-outline" size={24} color="#1f1a17" />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        {item.likes.length > 0 ? (
          <Text style={styles.likesText}>
            {item.likes.length}{item.likes.length !== 1 ? t('socialLikesPlural') : t('socialLikesSingular')}
          </Text>
        ) : null}

        {/* Caption */}
        <View style={styles.captionRow}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{item.user?.username || 'user'} </Text>
            {item.eventTitle ? `${t('socialCaptionWithEvent')} ${item.eventTitle}` : t('socialCaptionWithoutEvent')}
          </Text>
        </View>

        {/* Comments Preview */}
        {item.comments && item.comments.length > 0 ? (
          <TouchableOpacity onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}>
            <Text style={styles.viewCommentsText}>
              {t('socialViewAll')} {item.comments.length} {item.comments.length !== 1 ? t('socialCommentsPlural') : t('socialCommentsSingular')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}>
            <Text style={styles.viewCommentsText}>{t('socialAddComment')}</Text>
          </TouchableOpacity>
        )}

        {/* Date */}
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow="EventCapture"
          title={t('socialTab')}
          leading={
            <View style={styles.headerBadge}>
              <Ionicons name="images-outline" size={20} color={TabThemes.socialfeed.accent} />
            </View>
          }
          mode="compact"
          rightAction={
            <View style={styles.headerActions}>
              <IconActionButton icon="notifications-outline" onPress={() => router.push('/notifications')} />
              <IconActionButton icon="menu" onPress={() => router.push('/menu')} />
            </View>
          }
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
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
  headerBadge: {
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
    paddingVertical: Spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    justifyContent: 'center',
  },
  username: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1f1a17',
  },
  locationText: {
    fontSize: 12,
    color: '#8e6d63',
    marginTop: 1,
  },
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
  crownBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  crownGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  crownText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
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
    gap: 16,
  },
  actionButton: {
    padding: 2,
  },
  actionRight: {
    padding: 2,
  },
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
  captionUsername: {
    fontWeight: '700',
  },
  viewCommentsText: {
    paddingHorizontal: Spacing.lg,
    fontSize: 14,
    color: '#81776f',
    marginBottom: 6,
  },
  dateText: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    fontSize: 11,
    color: '#a39b95',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
