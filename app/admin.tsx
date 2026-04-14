import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@/context/UserContext';
import { usePosts } from '@/context/PostContext';
import { Colors } from '@/constants/theme';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppButton } from '@/components/ui/app-button';

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
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');

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
    Alert.alert('Delete Post', 'Are you sure you want to completely remove this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePost(postId),
      },
    ]);
  };

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionHeader}>Platform Users</Text>
      {USERS_LIST.map((u) => (
        <SurfaceCard key={u.id} style={styles.userCard}>
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
        </SurfaceCard>
      ))}
    </View>
  );

  const renderPostsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionHeader}>All Reported & Live Posts</Text>
      {posts.length === 0 ? (
        <Text style={styles.emptyText}>No posts available.</Text>
      ) : null}
      
      {posts.map((post) => (
        <SurfaceCard key={post.id} style={styles.postCard}>
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
              label="Remove Post"
              variant="secondary"
              onPress={() => handleDeletePost(post.id)}
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
            />
          </View>
        </SurfaceCard>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(250, 245, 240, 0.98)' }]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f1a17" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage platform content</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
            onPress={() => setActiveTab('users')}>
            <Ionicons
              name={activeTab === 'users' ? 'people' : 'people-outline'}
              size={20}
              color={activeTab === 'users' ? '#fff' : '#857a72'}
            />
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'posts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('posts')}>
            <Ionicons
              name={activeTab === 'posts' ? 'images' : 'images-outline'}
              size={20}
              color={activeTab === 'posts' ? '#fff' : '#857a72'}
            />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Posts</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'users' ? renderUsersTab() : renderPostsTab()}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e0d5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f1a17',
  },
  subtitle: {
    fontSize: 14,
    color: '#857a72',
    marginTop: 2,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  tabContent: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#857a72',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
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
  bottomPadding: {
    height: 80,
  },
});
