import { useUser } from '@/context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/theme';

export default function CreateProfileScreen() {
  const router = useRouter();
  const { createProfile, user } = useUser();
  const [avatarUri, setAvatarUri] = useState(user.avatarUri);
  const [username, setUsername] = useState(user.username);
  const [fullName, setFullName] = useState(user.fullName === 'Event Friend' ? '' : user.fullName);
  const [city, setCity] = useState(user.city);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('eventcapture123');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCompleteDisabled = !username.trim() || !fullName.trim() || !email.trim() || !password.trim();

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to choose a profile picture on your device.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#1f1612', '#352016', Colors.light.tintDark]} style={styles.background}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={20} color="#1f1a17" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>PROFILE</Text>
                  <Text style={styles.title}>Create your profile</Text>
                </View>
              </View>

              <Text style={styles.subtitle}>Set up the basics so your account already feels personal from the start.</Text>

              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Ionicons name="person-outline" size={40} color="#9d938b" />
                  )}
                </View>
                <TouchableOpacity style={styles.avatarBadge} onPress={pickAvatar}>
                  <Ionicons name="camera-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  placeholder="Choose a username"
                  placeholderTextColor="#91867f"
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  placeholder="Add your email"
                  placeholderTextColor="#91867f"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor="#91867f"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <TextInput
                  placeholder="Add your full name"
                  placeholderTextColor="#91867f"
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  placeholder="Where are you based?"
                  placeholderTextColor="#91867f"
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>About you</Text>
                <TextInput
                  placeholder="What kind of events do you love most?"
                  placeholderTextColor="#91867f"
                  style={[styles.input, styles.textArea]}
                  multiline
                  textAlignVertical="top"
                  value={bio}
                  onChangeText={setBio}
                />
              </View>

              <TouchableOpacity
                style={[styles.primary, (isCompleteDisabled || isSubmitting) && styles.primaryDisabled]}
                disabled={isCompleteDisabled || isSubmitting}
                onPress={async () => {
                  setIsSubmitting(true);
                  const result = await createProfile({
                    username,
                    fullName,
                    city,
                    bio,
                    avatarUri,
                    email,
                    password,
                  });
                  setIsSubmitting(false);
                  if (!result.ok) {
                    setError(result.error ?? 'Unable to create your account.');
                    return;
                  }
                  setError('');
                  router.replace('/(tabs)');
                }}>
                <Text style={styles.primaryText}>
                  {isSubmitting ? 'Creating account...' : 'Complete profile'}
                </Text>
              </TouchableOpacity>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1f1612' },
  flex: { flex: 1 },
  background: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
  card: {
    backgroundColor: '#fffaf5',
    borderRadius: 30,
    padding: 22,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: '#857a72', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#1f1a17', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#7d726a', lineHeight: 21 },
  avatarWrap: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#f3e7da',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fffaf5',
  },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#81776f', fontWeight: '700', fontSize: 12.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: '#1f1a17',
  },
  textArea: { minHeight: 110 },
  primary: {
    backgroundColor: Colors.light.tint,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  errorText: {
    color: '#c64d3a',
    fontWeight: '700',
    textAlign: 'center',
  },
});
