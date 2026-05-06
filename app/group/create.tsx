import { AppImage } from '@/components/ui/app-image';
import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, Layout, Radius, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { createGroup } from '@/services/groupsApi';
import { getFriends, type FriendListItem } from '@/services/friendsApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getFriends()
      .then((items) => setFriends(items))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load friends right now.'))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleSelection = (userId: string) => {
    setSelectedFriendIds((current) =>
      current.includes(userId) ? current.filter((entry) => entry !== userId) : [...current, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Add a group name before continuing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createGroup({
        name: name.trim(),
        description: description.trim(),
        invited_user_ids: selectedFriendIds,
      });
      showToast({
        tone: 'success',
        title: t('groupsTitle'),
        message: `${created.name} is ready.`,
      });
      router.replace({ pathname: '/group/[id]', params: { id: created.id } });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create this group right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow={t('groupsEyebrow')}
          title={t('groupsCreateTitle')}
          subtitle={t('groupsCreateSubtitle')}
          onBack={() => router.back()}
          mode="compact"
        />

        {error ? <FeedbackBanner tone="error" title={t('groupsTitle')} message={error} /> : null}

        <SurfaceCard style={styles.sectionCard}>
          <View style={styles.field}>
            <Text style={styles.label}>{t('groupsNameLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('groupsNamePlaceholder')}
              placeholderTextColor="#91867f"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('groupsDescriptionLabel')}</Text>
            <TextInput
              style={[styles.input, styles.multiInput]}
              placeholder={t('groupsDescriptionPlaceholder')}
              placeholderTextColor="#91867f"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('groupsInviteFriendsLabel')}</Text>

          {isLoading ? (
            <Text style={styles.emptyInline}>Loading...</Text>
          ) : friends.length ? (
            <View style={styles.stack}>
              {friends.map((entry) => {
                const selected = selectedFriendIds.includes(entry.friend.id);
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
            label={isSubmitting ? t('groupsCreateSubmitting') : t('groupsCreateSubmit')}
            disabled={isSubmitting}
            onPress={() => void handleCreate()}
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
  field: { gap: 8 },
  label: {
    color: Colors.light.title,
    fontWeight: '800',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.title,
  },
  multiInput: {
    minHeight: 120,
  },
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
