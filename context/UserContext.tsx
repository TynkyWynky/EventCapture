import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  changeAccountPassword,
  deleteAccount as deleteAccountApi,
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  requestPasswordReset,
  registerAccount,
  resetAccountPassword,
  updateAccountProfile,
} from '@/services/authApi';
import { clearCachedBackendApiBaseUrl, configureBackendApiAuth } from '@/services/backendApi';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  city: string;
  email: string;
  avatarUri: string;
  role: string;
  crownCount: number;
}

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface UserContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isReady: boolean;
  isBusy: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  createProfile: (profile: Omit<UserProfile, 'id' | 'role' | 'email' | 'crownCount'> & { email?: string; password: string }) => Promise<AuthActionResult>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string; resetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthActionResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthActionResult>;
  deleteAccount: () => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

interface StoredSessionState {
  token: string;
}

const STORAGE_KEY = 'eventcapture.session';
const DEFAULT_AVATAR = 'https://i.pravatar.cc/160?img=64';

const EMPTY_USER: UserProfile = {
  id: '',
  username: '',
  fullName: '',
  bio: '',
  city: 'Brussels',
  email: '',
  avatarUri: DEFAULT_AVATAR,
  role: 'user',
  crownCount: 0,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function mapApiUserToProfile(user: {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  city: string;
  email: string;
  avatar_uri: string;
  role: string;
  crown_count: number;
}): UserProfile {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    bio: user.bio,
    city: user.city,
    email: user.email,
    avatarUri: user.avatar_uri || DEFAULT_AVATAR,
    role: user.role,
    crownCount: typeof user.crown_count === 'number' ? user.crown_count : 0,
  };
}

function parseStoredSession(rawValue: string | null): StoredSessionState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredSessionState>;
    if (typeof parsed.token !== 'string' || !parsed.token.trim()) {
      return null;
    }
    return { token: parsed.token };
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    configureBackendApiAuth(() => token);
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        const session = parseStoredSession(storedValue);

        if (!session?.token) {
          return;
        }

        if (!isMounted) {
          return;
        }

        setToken(session.token);
        configureBackendApiAuth(() => session.token);
        const currentUser = await fetchCurrentUser();

        if (!isMounted) {
          return;
        }

        setUser(mapApiUserToProfile(currentUser));
        setIsAuthenticated(true);
      } catch {
        if (isMounted) {
          setToken(null);
          setUser(EMPTY_USER);
          setIsAuthenticated(false);
        }
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token })).catch(() => {});
  }, [isReady, token]);

  const value = useMemo<UserContextType>(
    () => ({
      user,
      isAuthenticated,
      isReady,
      isBusy,
      isAdmin: user.role === 'admin',
      refreshCurrentUser: async () => {
        if (!token) {
          return;
        }

        const currentUser = await fetchCurrentUser();
        setUser(mapApiUserToProfile(currentUser));
        setIsAuthenticated(true);
      },
      signIn: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();

        if (!normalizedEmail || !normalizedPassword) {
          return { ok: false, error: 'Enter both email and password.' };
        }

        setIsBusy(true);
        try {
          const response = await loginAccount(normalizedEmail, normalizedPassword);
          setToken(response.token);
          setUser(mapApiUserToProfile(response.user));
          setIsAuthenticated(true);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Sign in failed.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      createProfile: async (profile) => {
        const email = profile.email?.trim() ?? '';
        const password = profile.password.trim();
        if (!email || !password || !profile.username.trim() || !profile.fullName.trim()) {
          return { ok: false, error: 'Complete all required fields.' };
        }

        setIsBusy(true);
        try {
          const response = await registerAccount({
            username: profile.username.trim(),
            full_name: profile.fullName.trim(),
            email,
            password,
            city: profile.city.trim() || 'Brussels',
            bio: profile.bio.trim(),
            avatar_uri: profile.avatarUri.trim() || DEFAULT_AVATAR,
          });
          setToken(response.token);
          setUser(mapApiUserToProfile(response.user));
          setIsAuthenticated(true);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to create account.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      updateProfile: async (profile) => {
        if (!isAuthenticated) {
          return { ok: false, error: 'Sign in to update your profile.' };
        }

        setIsBusy(true);
        try {
          const updated = await updateAccountProfile({
            username: profile.username?.trim() || user.username,
            full_name: profile.fullName?.trim() || user.fullName,
            city: profile.city?.trim() || user.city,
            bio: profile.bio?.trim() || user.bio,
            avatar_uri: profile.avatarUri?.trim() || user.avatarUri,
            email: profile.email?.trim() || user.email,
          });
          setUser(mapApiUserToProfile(updated));
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to update profile.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      requestPasswordReset: async (email) => {
        setIsBusy(true);
        try {
          const response = await requestPasswordReset(email.trim());
          return { ok: true, resetToken: response.reset_token ?? undefined };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to start password reset.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      resetPassword: async (tokenValue, newPassword) => {
        setIsBusy(true);
        try {
          await resetAccountPassword(tokenValue.trim(), newPassword.trim());
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to reset password.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      changePassword: async (currentPassword, newPassword) => {
        if (!currentPassword.trim() || !newPassword.trim()) {
          return { ok: false, error: 'Enter your current and new password.' };
        }

        setIsBusy(true);
        try {
          await changeAccountPassword(currentPassword.trim(), newPassword.trim());
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to change password.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      deleteAccount: async () => {
        setIsBusy(true);
        try {
          await deleteAccountApi();
          setToken(null);
          setUser(EMPTY_USER);
          setIsAuthenticated(false);
          clearCachedBackendApiBaseUrl();
          await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : 'Unable to delete account.',
          };
        } finally {
          setIsBusy(false);
        }
      },
      signOut: async () => {
        try {
          await logoutAccount();
        } catch {
          // Still clear the local session if the backend cannot be reached.
        } finally {
          setToken(null);
          setUser(EMPTY_USER);
          setIsAuthenticated(false);
          clearCachedBackendApiBaseUrl();
          await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
      },
    }),
    [isAuthenticated, isBusy, isReady, token, user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
