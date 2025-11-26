import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/reset" />
        <Stack.Screen name="profile/create" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="filters" />
        <Stack.Screen name="menu" options={{ presentation: 'transparentModal', animation: 'slide_from_right' }} />
        <Stack.Screen name="likes" />
        <Stack.Screen name="comments" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="event/create" />
        <Stack.Screen name="event/detail" />
        <Stack.Screen name="event/my" />
        <Stack.Screen name="camera/review-success" />
        <Stack.Screen name="camera/review-fail" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
