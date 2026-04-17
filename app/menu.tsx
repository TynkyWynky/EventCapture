import { useUser } from '@/context/UserContext';
import { AppButton } from '@/components/ui/app-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

const getMenuItems = (t: any) => [
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t('menuEyebrow')}</Text>
              <Text style={styles.title}>{t('menuTitle')}</Text>
              <Text style={styles.subtitle}>{t('menuSubtitle')}</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close" size={20} color="#1f1a17" />
            </TouchableOpacity>
          </View>

          <SurfaceCard style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="sparkles-outline" size={18} color={Colors.light.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{t('menuHeroTitle')}</Text>
              <Text style={styles.heroText}>{t('menuHeroText')}</Text>
            </View>
          </SurfaceCard>

          <View style={styles.section}>
            {user.email === 'admin' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin' as any)}>
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
                onPress={() => router.push(item.route as any)}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color="#1f1a17" />
                </View>

                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuHint}>{item.subtitle}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#8b8078" />
              </TouchableOpacity>
            ))}
          </View>

          <AppButton
            label={t('signOutBtn')}
            variant="secondary"
            style={styles.signOutButton}
            onPress={() => {
              signOut();
              router.replace('/auth/login');
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
    backgroundColor: 'rgba(12, 8, 5, 0.24)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    width: '84%',
    height: '100%',
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: -8, height: 0 },
    elevation: 16,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d9cabc',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: '#857a72',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#1f1a17',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#7d736b',
    lineHeight: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#231b17',
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 17,
    fontWeight: '800',
  },
  heroText: {
    color: '#d8c7ba',
    marginTop: 6,
    lineHeight: 19,
  },
  section: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
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
    borderRadius: 16,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    color: '#1f1a17',
    fontSize: 15,
    fontWeight: '800',
  },
  menuHint: {
    color: '#81776f',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
  signOutButton: {
    marginTop: 4,
    backgroundColor: '#fff1ee',
    borderWidth: 1,
    borderColor: '#f4c9c0',
  },
});
