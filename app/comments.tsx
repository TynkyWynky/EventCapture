import { useEvents } from '@/context/EventContext';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function CommentsScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { getEventById } = useEvents();
  const { getEventSocial, addEventComment } = useSocial();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const event = getEventById(eventId);
  const social = getEventSocial(eventId);
  const comments = useMemo(() => social?.comments ?? [], [social?.comments]);

  const handleSend = () => {
    if (!event?.id) {
      return;
    }

    const result = addEventComment(event.id, event.title, text);

    if (result.ok) {
      setText('');
    } else if (result.error) {
      showToast({ title: 'Comment failed', message: result.error, tone: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          eyebrow="ENGAGEMENT"
          title="Comments"
          subtitle={event?.title ?? 'Event discussion'}
          onBack={() => router.back()}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {comments.length ? (
            comments.map((item) => (
              <View key={item.id} style={styles.commentCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.user}</Text>
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
              message="Start the conversation around this event."
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
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },
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
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#1f1a17',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
