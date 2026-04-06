import { usePosts } from '@/context/PostContext';
import { useUser } from '@/context/UserContext';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppImage } from '@/components/ui/app-image';

import { Colors } from '@/constants/theme';

export default function PostCommentsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const { posts, addPostComment } = usePosts();
  const { user } = useUser();
  const [text, setText] = useState('');
  
  const post = posts.find((p) => p.id === postId);
  const comments = post?.comments ?? [];

  const handleSend = () => {
    if (!post?.id || !text.trim()) {
      return;
    }

    const postUser = {
      id: user.username,
      username: user.username,
      avatarUri: user.avatarUri,
    };

    const result = addPostComment(post.id, postUser, text);

    if (result.ok) {
      setText('');
    }
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerWrap}>
          <ScreenHeader
            eyebrow="ENGAGEMENT"
            title="Comments"
            subtitle="Post not found"
            onBack={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow="ENGAGEMENT"
          title="Comments"
          subtitle={`Post by ${post.user.username}`}
          onBack={() => router.back()}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          
          {/* Caption / Original Post Content */}
          <View style={styles.captionCard}>
            {post.user.avatarUri ? (
              <AppImage source={{ uri: post.user.avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#aaa" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{post.user.username}</Text>
                <Text style={styles.time}>{post.date}</Text>
              </View>
              <Text style={styles.comment}>
                {post.eventTitle ? `Captured a memory at ${post.eventTitle}` : 'Captured a great moment'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {comments.length ? (
            comments.map((item) => (
              <View key={item.id} style={styles.commentCard}>
                {item.user.avatarUri ? (
                  <AppImage source={{ uri: item.user.avatarUri }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={16} color="#aaa" />
                  </View>
                )}
                
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.user.username}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                  <View style={styles.bubble}>
                    <Text style={styles.comment}>{item.text}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="No comments yet"
              message="Be the first to comment on this photo."
            />
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Add a comment..."
            style={styles.input}
            placeholderTextColor="#8c827a"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.send} onPress={handleSend}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  captionCard: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eae3db',
    marginHorizontal: 14,
    marginBottom: 8,
  },
  commentCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { color: '#1f1a17', fontWeight: '800' },
  time: { color: '#8c827a', fontSize: 12.5 },
  bubble: { backgroundColor: '#f6eee4', borderRadius: 16, padding: 12 },
  comment: { color: '#514943', lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    backgroundColor: Colors.light.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#1f1a17',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
