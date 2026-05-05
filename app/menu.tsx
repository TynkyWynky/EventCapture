import { useUser } from '@/context/UserContext';
import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { IconActionButton } from '@/components/ui/icon-action-button';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

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
    label: t('menuEditProfileLabel'),
    subtitle: t('menuEditProfileHint'),
    icon: 'create-outline',
    route: '/profile/edit',
  },
  {
    label: t('menuSettingsLabel'),
    subtitle: t('menuSettingsHint'),
    icon: 'settings-outline',
    route: '/settings',
  },
  {
    label: t('menuFaqLabel'),
    subtitle: t('menuFaqHint'),
    icon: 'help-circle-outline',
    route: '/faq',
  },
  {
    label: t('menuContactLabel'),
    subtitle: t('menuContactHint'),
    icon: 'mail-outline',
    route: '/contact',
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
  const { t } = useLanguage();
  const menuItems = getMenuItems(t);

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />

      <View style={styles.sheet}>
        <View style={styles.edgeGlow} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <ScreenHeader
            eyebrow={t('menuEyebrow')}
            title={t('menuTitle')}
            subtitle={t('menuSubtitle')}
            leading={
              user.avatarUri ? (
                <AppImage source={{ uri: user.avatarUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{user.username.charAt(0).toUpperCase()}</Text>
                </View>
              )
            }
            rightAction={<IconActionButton icon="close" tone="subtle" onPress={() => router.back()} />}
            mode="compact"
            surface={false}
          />

          <SurfaceCard style={styles.accountCard} variant="feature">
            <View style={styles.accountTop}>
              <View style={styles.accountCopy}>
                <Text style={styles.accountEyebrow}>
                  {user.role === 'admin' ? 'Admin access' : user.city}
                </Text>
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

            <Text style={styles.accountText}>{t('menuHeroText')}</Text>
          </SurfaceCard>

          <View style={styles.menuList}>
            {user.role === 'admin' && (
              <TouchableOpacity
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
            )}

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
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
    backgroundColor: Colors.light.scrim,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    width: '86%',
    height: '100%',
    backgroundColor: Colors.light.canvas,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    borderLeftWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: -10, height: 0 },
    elevation: 20,
    overflow: 'hidden',
  },
  edgeGlow: {
    position: 'absolute',
    top: 72,
    left: -28,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(244, 123, 32, 0.08)',
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
  accountCard: {
    gap: 12,
  },
  accountTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
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
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    ...Typography.bodySm,
    color: Colors.light.subtitle,
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
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
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
    width: 28,
    height: 28,
    borderRadius: Radius.round,
    backgroundColor: Colors.light.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButton: {
    marginTop: 6,
    backgroundColor: '#fff6f3',
    borderWidth: 1,
    borderColor: '#f1d6cf',
  },
});
