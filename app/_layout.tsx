import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EventProvider } from '@/context/EventContext';
import { FilterProvider } from '@/context/FilterContext';
import { PostProvider } from '@/context/PostContext';
import { SocialProvider } from '@/context/SocialContext';
import { ToastProvider } from '@/context/ToastContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '@/context/LanguageContext';

function AuthNavigatorGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady } = useUser();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const isAuthRoute = pathname.startsWith('/auth/');
    const isCreateProfileRoute = pathname === '/profile/create';
    const isOnboardingRoute = pathname === '/onboarding';
    const isSplashRoute = pathname === '/';
    const isPublicRoute = isSplashRoute || isAuthRoute || isCreateProfileRoute || isOnboardingRoute;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/onboarding');
      return;
    }

    if (isAuthenticated && (pathname === '/auth/login' || pathname === '/auth/reset' || pathname === '/profile/create' || pathname === '/onboarding')) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isReady, pathname, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <UserProvider>
          <EventProvider>
            <FilterProvider>
              <ToastProvider>
                <PostProvider>
                  <SocialProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                      <AuthNavigatorGuard />
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="auth/login" />
                        <Stack.Screen name="auth/reset" />
                        <Stack.Screen name="auth/change-password" />
                        <Stack.Screen name="profile/create" />
                        <Stack.Screen name="profile/edit" />
                        <Stack.Screen name="terms" />
                        <Stack.Screen name="filters" />
                        <Stack.Screen
                          name="menu"
                          options={{
                            presentation: Platform.OS === 'web' ? 'card' : 'transparentModal',
                            animation: 'slide_from_right',
                          }}
                        />
                        <Stack.Screen name="likes" />
                        <Stack.Screen name="comments" />
                        <Stack.Screen name="notifications" />
                        <Stack.Screen name="contact" />
                        <Stack.Screen name="faq" />
                        <Stack.Screen name="settings" />
                        <Stack.Screen name="admin/index" />
                        <Stack.Screen name="admin/event-edit" />
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
                  </SocialProvider>
                </PostProvider>
              </ToastProvider>
            </FilterProvider>
          </EventProvider>
        </UserProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
