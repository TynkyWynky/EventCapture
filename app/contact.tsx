import { AppButton } from '@/components/ui/app-button';
import { FeedbackBanner } from '@/components/ui/feedback-banner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      setStatus('error');
      return;
    }

    setStatus('success');
    setSubject('');
    setMessage('');
    showToast({
      tone: 'success',
      title: 'Support note staged',
      message: 'Your message was queued in this mock support flow.',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <ScreenHeader
          eyebrow="SUPPORT"
          title="Contact"
          subtitle="Questions, bug reports, and product feedback all belong here."
          onBack={() => router.back()}
        />

        <SurfaceCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>We would love to hear from you</Text>
          <Text style={styles.heroText}>
            Tell us what broke, what felt great, or what would make the app more useful for your nights out.
          </Text>
        </SurfaceCard>

        {status === 'error' ? (
          <FeedbackBanner
            tone="error"
            title="Add a subject and message"
            message="A little more context helps support feel a lot more real."
          />
        ) : null}

        {status === 'success' ? (
          <FeedbackBanner
            tone="success"
            title="Message queued"
            message="This is a mock flow for now, but your note has been staged like a real support request."
          />
        ) : null}

        <SurfaceCard style={styles.sectionCard}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.singleInput}
            placeholder="Bug report, feature idea, account issue..."
            placeholderTextColor="#91867f"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Your message</Text>
          <TextInput
            style={styles.input}
            placeholder="Tell us what happened, what you need, or what we can improve."
            placeholderTextColor="#91867f"
            multiline
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          <AppButton label="Send message" onPress={handleSend} />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  container: { padding: 16, gap: 16, paddingBottom: 152 },
  heroCard: {
    backgroundColor: '#231b17',
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#d7c7bb',
    marginTop: 8,
    lineHeight: 21,
  },
  sectionCard: {
    gap: 12,
  },
  label: {
    color: '#1f1a17',
    fontWeight: '800',
    fontSize: 16,
  },
  singleInput: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    minHeight: 180,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
});
