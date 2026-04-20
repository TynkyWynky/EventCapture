import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@/context/UserContext';
import { usePosts } from '@/context/PostContext';
import { useEvents } from '@/context/EventContext';
import { useLanguage } from '@/context/LanguageContext';
import { Colors, Layout, Typography } from '@/constants/theme';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppButton } from '@/components/ui/app-button';
import { ScreenHeader } from '@/components/ui/screen-header';

const USERS_LIST = [
  {
    id: 'u_admin',
    username: 'admin',
    email: 'admin',
    role: 'Admin',
    avatar: 'https://i.pravatar.cc/160?img=68',
  },
  {
    id: 'u_demo',
    username: 'eventfriend',
    email: 'demo@eventcapture.app',
    role: 'User',
    avatar: 'https://i.pravatar.cc/160?img=64',
  },
  {
    id: 'u1',
    username: 'alex',
    email: 'alex@example.com',
    role: 'User',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'u2',
    username: 'sarah_night',
    email: 'sarah@example.com',
    role: 'User',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 's_lina',
    username: 'Lina',
    email: 'lina@example.com',
    role: 'User',
    avatar: 'https://i.pravatar.cc/150?img=32',
  },
  {
    id: 's_milan',
    username: 'Milan',
    email: 'milan@example.com',
    role: 'User',
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
];

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { posts, deletePost } = usePosts();
  const { events, deleteEvent } = useEvents();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'events'>('events');
  const [usersList, setUsersList] = useState(USERS_LIST);
  const [selectedUser, setSelectedUser] = useState<typeof USERS_LIST[0] | null>(null);

  useEffect(() => {
    // If not admin, redirect back to home
    if (user.email !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [user.email, router]);

  if (user.email !== 'admin') {
    return null; // Don't render until redirected
  }

  const handleDeletePost = (postId: string) => {
    Alert.alert(t('adminConfirmDelPostTitle'), t('adminConfirmDelPostMsg'), [
      { text: t('adminBtnCancel'), style: 'cancel' },
      {
        text: t('adminBtnDelete'),
        style: 'destructive',
        onPress: () => deletePost(postId),
      },
    ]);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(t('adminConfirmDelEventTitle'), t('adminConfirmDelEventMsg'), [
      { text: t('adminBtnCancel'), style: 'cancel' },
      {
        text: t('adminBtnDelete'),
        style: 'destructive',
        onPress: () => deleteEvent(eventId),
      },
    ]);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'u_admin') {
      Alert.alert(t('adminCannotDelAdminTitle'), t('adminCannotDelAdminMsg'));
      return;
    }
    Alert.alert(t('adminConfirmBanUserTitle'), t('adminConfirmBanUserMsg'), [
      { text: t('adminBtnCancel'), style: 'cancel' },
      {
        text: t('adminBtnBan'),
        style: 'destructive',
        onPress: () => setUsersList((prev) => prev.filter(u => u.id !== userId)),
      },
    ]);
  };

  const renderStatsOverview = () => (
    <View style={styles.statsContainer}>
      <SurfaceCard style={styles.statCard} variant="subtle">
        <Ionicons name="calendar" size={24} color="#857a72" />
        <Text style={styles.statValue}>{events.length}</Text>
        <Text style={styles.statLabel}>{t('adminStatEvents')}</Text>
      </SurfaceCard>
      <SurfaceCard style={styles.statCard} variant="subtle">
        <Ionicons name="images" size={24} color="#857a72" />
        <Text style={styles.statValue}>{posts.length}</Text>
        <Text style={styles.statLabel}>{t('adminStatPosts')}</Text>
      </SurfaceCard>
      <SurfaceCard style={styles.statCard} variant="subtle">
        <Ionicons name="people" size={24} color="#857a72" />
        <Text style={styles.statValue}>{usersList.length}</Text>
        <Text style={styles.statLabel}>{t('adminStatUsers')}</Text>
      </SurfaceCard>
    </View>
  );

  const renderUserModal = () => {
    if (!selectedUser) return null;
    return (
      <Modal visible={true} animationType="fade" transparent onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedUser(null)}>
              <Ionicons name="close" size={24} color="#1f1a17" />
            </TouchableOpacity>
            
            <Image source={{ uri: selectedUser.avatar }} style={styles.modalAvatar} />
            <Text style={styles.modalName}>{selectedUser.username}</Text>
            <Text style={styles.modalEmail}>{selectedUser.email}</Text>
            
            <View style={styles.modalRoleWrap}>
              <View style={[styles.roleBadge, selectedUser.role === 'Admin' && styles.roleBadgeAdmin]}>
                <Text style={[styles.roleText, selectedUser.role === 'Admin' && styles.roleTextAdmin]}>
                  {selectedUser.role}
                </Text>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              {selectedUser.role !== 'Admin' && (
                <AppButton 
                  label={t('adminBtnBan')} 
                  variant="secondary" 
                  style={styles.deleteButton} 
                  textStyle={styles.deleteButtonText}
                  onPress={() => {
                    handleDeleteUser(selectedUser.id);
                    setSelectedUser(null);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionHeader}>{t('adminSectUsers')}</Text>
      {usersList.map((u) => (
        <TouchableOpacity key={u.id} activeOpacity={0.8} onPress={() => setSelectedUser(u)}>
          <SurfaceCard style={styles.userCard}>
            <Image source={{ uri: u.avatar }} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.username}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
            </View>
            <View style={[styles.roleBadge, u.role === 'Admin' && styles.roleBadgeAdmin]}>
              <Text style={[styles.roleText, u.role === 'Admin' && styles.roleTextAdmin]}>
                {u.role}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#857a72" />
          </SurfaceCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPostsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionHeader}>{t('adminSectPosts')}</Text>
      {posts.length === 0 ? (
        <Text style={styles.emptyText}>{t('adminNoPosts')}</Text>
      ) : null}
      
      {posts.map((post) => (
        <TouchableOpacity key={post.id} activeOpacity={0.9} onPress={() => router.push({ pathname: '/post-comments', params: { postId: post.id } })}>
          <SurfaceCard style={styles.postCard}>
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatarUri }} style={styles.postAvatar} />
              <View style={styles.postHeaderText}>
                <Text style={styles.postUserName}>{post.user.username}</Text>
                <Text style={styles.postDate}>{post.date} • {post.eventTitle || 'No Event'}</Text>
              </View>
            </View>

            <Image source={{ uri: post.imageUri }} style={styles.postImage} />
            
            <View style={styles.postFooter}>
              <View style={styles.postMeta}>
                <View style={styles.metaBadge}>
                  <Ionicons name="heart" size={14} color="#e45b5b" />
                  <Text style={styles.metaCount}>{post.likes.length}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons name="chatbubble" size={14} color="#857a72" />
                  <Text style={styles.metaCount}>{post.comments.length}</Text>
                </View>
              </View>
              <AppButton
                label={t('adminBtnRemovePost')}
                variant="secondary"
                onPress={() => handleDeletePost(post.id)}
                style={styles.deleteButton}
                textStyle={styles.deleteButtonText}
              />
            </View>
          </SurfaceCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{t('adminSectEvents')}</Text>
        <TouchableOpacity style={styles.addEventButton} onPress={() => router.push('/event/create')}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addEventText}>{t('adminBtnNewEvent')}</Text>
        </TouchableOpacity>
      </View>
      
      {events.length === 0 ? (
        <Text style={styles.emptyText}>{t('adminNoEvents')}</Text>
      ) : null}
      
      {events.map((event) => (
        <TouchableOpacity key={event.id} activeOpacity={0.9} onPress={() => router.push({ pathname: '/event/detail', params: { eventId: event.id } })}>
          <SurfaceCard style={styles.eventCard} variant="subtle">
            <Image source={{ uri: event.heroImage || 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=80' }} style={styles.eventImage} />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{event.fullDate}</Text>
              <Text style={styles.eventPlace}>{event.place}</Text>
              
              <View style={styles.eventActions}>
                <AppButton
                  label={t('adminBtnEdit')}
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/admin/event-edit', params: { eventId: event.id } })}
                  style={styles.editEventButton}
                  textStyle={styles.editEventButtonText}
                />
                <AppButton
                  label={t('adminBtnDelete')}
                  variant="secondary"
                  onPress={() => handleDeleteEvent(event.id)}
                  style={styles.deleteButton}
                  textStyle={styles.deleteButtonText}
                />
              </View>
            </View>
          </SurfaceCard>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(250, 245, 240, 0.98)' }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            eyebrow="ADMIN"
            title={t('adminTitle')}
            subtitle={t('adminSubtitle')}
            onBack={() => router.back()}
            mode="compact"
          />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'events' && styles.tabButtonActive]}
            onPress={() => setActiveTab('events')}>
            <Ionicons
              name={activeTab === 'events' ? 'calendar' : 'calendar-outline'}
              size={20}
              color={activeTab === 'events' ? '#fff' : '#857a72'}
            />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>{t('adminTabEvents')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('posts')}>
            <Ionicons
              name={activeTab === 'posts' ? 'images' : 'images-outline'}
              size={20}
              color={activeTab === 'posts' ? '#fff' : '#857a72'}
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>{t('adminTabPosts')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
            onPress={() => setActiveTab('users')}>
            <Ionicons
              name={activeTab === 'users' ? 'people' : 'people-outline'}
              size={20}
              color={activeTab === 'users' ? '#fff' : '#857a72'}
            />
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>{t('adminTabUsers')}</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStatsOverview()}
          {activeTab === 'users' ? renderUsersTab() : activeTab === 'posts' ? renderPostsTab() : renderEventsTab()}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
      
      {renderUserModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: '#fff',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e8e0d5',
  },
  tabButtonActive: {
    backgroundColor: '#1f1a17',
    borderColor: '#1f1a17',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#857a72',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
  },
  tabContent: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    ...Typography.eyebrow,
    color: Colors.light.subtitle,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e7da',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f1a17',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#857a72',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#f3e7da',
  },
  roleBadgeAdmin: {
    backgroundColor: '#fcd34d',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#857a72',
  },
  roleTextAdmin: {
    color: '#78350f',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    color: '#857a72',
  },
  postCard: {
    padding: 16,
    gap: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3e7da',
  },
  postHeaderText: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f1a17',
  },
  postDate: {
    fontSize: 13,
    color: '#857a72',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#f3e7da',
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  metaCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f1a17',
  },
  deleteButton: {
    height: 36,
    paddingHorizontal: 16,
    backgroundColor: '#fee2e2',
    borderWidth: 0,
  },
  deleteButtonText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f1a17',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#857a72',
    textTransform: 'uppercase',
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1a17',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 4,
  },
  addEventText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  eventCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  eventImage: {
    width: '100%',
    height: 140,
  },
  eventInfo: {
    padding: 16,
    gap: 6,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f1a17',
  },
  eventDate: {
    fontSize: 14,
    color: '#857a72',
    fontWeight: '500',
  },
  eventPlace: {
    fontSize: 14,
    color: '#857a72',
    marginBottom: 8,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editEventButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#f3e7da',
    borderWidth: 0,
  },
  editEventButtonText: {
    fontSize: 13,
    color: '#1f1a17',
  },
  iconButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 26, 23, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e7da',
    marginBottom: 16,
    marginTop: 8,
  },
  modalName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f1a17',
    marginBottom: 4,
  },
  modalEmail: {
    fontSize: 15,
    color: '#857a72',
    marginBottom: 16,
  },
  modalRoleWrap: {
    marginBottom: 24,
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  bottomPadding: {
    height: 80,
  },
});
