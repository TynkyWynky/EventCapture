import { useUser } from '@/context/UserContext';
import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useSocial } from '@/context/SocialContext';

const getMenuItems = (
  t: ReturnType<typeof useLanguage>['t']
): { label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: Href }[] => [
  {
    label: t('menuProfileLabel'),
    subtitle: t('menuProfileHint'),
    icon: 'person-circle-outline',
    route: '/profile',
  },
  {
    label: t('menuMyNightLabel'),
    subtitle: t('menuMyNightHint'),
    icon: 'calendar-outline',
    route: '/event/my',
  },
  {
    label: t('menuNotificationsLabel'),
    subtitle: t('menuNotificationsHint'),
    icon: 'notifications-outline',
    route: '/notifications',
  },
  {
    label: t('menuFriendsLabel'),
    subtitle: t('menuFriendsHint'),
    icon: 'people-outline',
    route: '/friends',
  },
  {
    label: t('menuGroupsLabel'),
    subtitle: t('menuGroupsHint'),
    icon: 'people-circle-outline',
    route: '/groups',
  },
  {
    label: t('menuSettingsLabel'),
    subtitle: t('menuSettingsHint'),
    icon: 'settings-outline',
    route: '/settings',
  },
  {
    label: t('menuEditProfileLabel'),
    subtitle: t('menuEditProfileHint'),
    icon: 'create-outline',
    route: '/profile/edit',
  },
  {
    label: t('menuContactLabel'),
    subtitle: t('menuContactHint'),
    icon: 'mail-outline',
    route: '/contact',
  },
  {
    label: t('menuFaqLabel'),
    subtitle: t('menuFaqHint'),
    icon: 'help-circle-outline',
    route: '/faq',
  },
  {
    label: t('menuTermsLabel'),
    subtitle: t('menuTermsHint'),
    icon: 'document-text-outline',
    route: '/terms',
  },
];

export default function MenuScreen() {
  const router = useRouter();
  const { user, signOut } = useUser();
  const { unreadCount } = useSocial();
  const { t } = useLanguage();
  const menuItems = getMenuItems(t);

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <ScreenHeader
            eyebrow={t('menuEyebrow')}
            title={t('menuTitle')}
            subtitle={t('menuUtilitiesSub')}
            leading={
              user.avatarUri ? (
                <AppImage source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{user.username.charAt(0).toUpperCase()}</Text>
                </View>
              )
            }
            rightAction={<IconActionButton icon="close" tone="subtle" accessibilityLabel="Close menu" onPress={() => router.back()} />}
            mode="compact"
            surface={false}
          />

          <View style={styles.accountStrip}>
            <View style={styles.accountCopy}>
              <Text style={styles.accountEyebrow}>{user.role === 'admin' ? 'Admin access' : user.city}</Text>
              <Text style={styles.accountName}>{user.fullName || user.username}</Text>
              <Text style={styles.accountMeta}>@{user.username}</Text>
            </View>

            <View style={styles.accountBadge}>
              <Ionicons
                name={user.role === 'admin' ? 'shield-checkmark-outline' : 'sparkles-outline'}
                size={18}
                color={Colors.light.tint}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('menuUtilitiesTitle')}</Text>
          </View>

          <View style={styles.menuList}>
            {user.role === 'admin' ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('adminDashTitle')}
                style={styles.menuItem}
                activeOpacity={0.9}
                onPress={() => router.push('/admin')}>
                <View style={[styles.menuIconWrap, { backgroundColor: '#fcd34d' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#78350f" />
                </View>

                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuLabel}>{t('adminDashTitle')}</Text>
                  <Text style={styles.menuHint}>{t('adminDashHint')}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#8b8078" />
              </TouchableOpacity>
            ) : null}

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={styles.menuItem}
                activeOpacity={0.9}
                onPress={() => router.push(item.route)}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#1f1a17" />
                </View>

                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuHint}>{item.subtitle}</Text>
                </View>

                <View style={styles.chevronWrap}>
                  {item.route === '/notifications' && unreadCount ? (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color="#8b8078" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <AppButton
            label={t('signOutBtn')}
            variant="secondary"
            style={styles.signOutButton}
            onPress={() => {
              void signOut().then(() => {
                router.replace('/auth/login');
              });
            }}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'web' ? Colors.light.background : Colors.light.scrim,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    width: '84%',
    height: '100%',
    backgroundColor: Colors.light.canvas,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    borderLeftWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.floating,
    overflow: 'hidden',
  },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff7ef',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
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
  accountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.xl,
    padding: 14,
  },
  accountCopy: { flex: 1, gap: 2 },
  accountEyebrow: {
    ...Typography.eyebrow,
    color: Colors.light.tint,
  },
  accountName: {
    ...Typography.titleSm,
    color: Colors.light.title,
  },
  accountMeta: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
  },
  accountBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.cardFeature,
    borderWidth: 1,
    borderColor: Colors.light.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: { paddingTop: 4 },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.title,
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    ...Shadows.soft,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.cardFeature,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    ...Typography.body,
    color: Colors.light.title,
    fontWeight: '800',
  },
  menuHint: {
    ...Typography.caption,
    color: Colors.light.subtitle,
    marginTop: 4,
  },
  chevronWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    borderRadius: Radius.round,
    backgroundColor: Colors.light.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  signOutButton: {
    marginTop: 6,
    backgroundColor: '#fff6f3',
    borderWidth: 1,
    borderColor: '#f1d6cf',
  },
});
