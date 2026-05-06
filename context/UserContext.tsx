import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  changeRemotePassword,
  confirmRemotePasswordReset,
  deleteRemoteCurrentUser,
  fetchRemoteCurrentUser,
  registerRemoteUser,
  requestRemotePasswordReset,
  signInRemoteUser,
  updateRemoteCurrentUser,
} from '@/services/authApi';
import { BackendApiError, setBackendAccessToken } from '@/services/backendApi';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  city: string;
  email: string;
  avatarUri: string;
  role: string;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface PasswordResetRequestResult extends AuthResult {
  challengeId?: string | null;
  debugCode?: string | null;
  message?: string;
}

interface UserContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  createProfile: (profile: Omit<UserProfile, 'id' | 'role'> & { password: string }) => Promise<AuthResult>;
  updateProfile: (profile: Partial<Omit<UserProfile, 'id' | 'role'>>) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResult>;
  confirmPasswordReset: (
    challengeId: string,
    code: string,
    newPassword: string
  ) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  signOut: () => void;
}

interface StoredUserState {
  user: UserProfile;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'eventcapture.user';
const DEFAULT_AVATAR = 'https://i.pravatar.cc/160?img=64';

const DEFAULT_USER: UserProfile = {
  id: '',
  username: 'eventfriend',
  fullName: 'Event Friend',
  bio: 'Capturing nights, collecting crowns and keeping the best event memories close.',
  city: 'Brussels',
  email: 'demo@eventcapture.app',
  avatarUri: DEFAULT_AVATAR,
  role: 'user',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function isValidUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as UserProfile;

  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.fullName === 'string' &&
    typeof user.bio === 'string' &&
    typeof user.city === 'string' &&
    typeof user.email === 'string' &&
    typeof user.avatarUri === 'string' &&
    typeof user.role === 'string'
  );
}

function parseStoredUserState(rawValue: string | null): StoredUserState | null {
  if (!rawValue) {
    return null;
  }

  const parsedValue = JSON.parse(rawValue) as Partial<StoredUserState>;

  if (!isValidUserProfile(parsedValue.user)) {
    return null;
  }

  const accessToken =
    typeof parsedValue.accessToken === 'string' && parsedValue.accessToken.trim()
      ? parsedValue.accessToken
      : null;

  return {
    user: parsedValue.user,
    accessToken,
    isAuthenticated: Boolean(parsedValue.isAuthenticated && accessToken),
  };
}

function normalizeError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError || error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedState = parseStoredUserState(storedUser);

        if (!parsedState || !isMounted) {
          return;
        }

        setUser(parsedState.user);
        setAccessToken(parsedState.accessToken);
        setBackendAccessToken(parsedState.accessToken);
        setIsAuthenticated(parsedState.isAuthenticated);

        if (parsedState.isAuthenticated && parsedState.accessToken) {
          try {
            const remoteUser = await fetchRemoteCurrentUser();
            if (!isMounted) {
              return;
            }
            setUser(remoteUser);
          } catch (error) {
            if (!isMounted) {
              return;
            }

            if (error instanceof BackendApiError && error.status === 401) {
              setBackendAccessToken(null);
              setAccessToken(null);
              setUser(DEFAULT_USER);
              setIsAuthenticated(false);
            }
          }
        }
      } catch {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore cleanup failures and keep default user state in memory.
        }
      } finally {
        if (isMounted) {
          setHasHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user,
        accessToken,
        isAuthenticated,
      })
    ).catch(() => {
      // Keep the app usable even if persistence is unavailable.
    });
  }, [accessToken, hasHydrated, isAuthenticated, user]);

  const value = useMemo<UserContextType>(
    () => ({
      user,
      isAuthenticated,
      isReady: hasHydrated,
      signIn: async (email, password) => {
        const normalizedEmail = email.trim();
        const normalizedPassword = password.trim();

        if (!normalizedEmail || !normalizedPassword) {
          return { ok: false, error: 'Enter both email and password.' };
        }

        try {
          const session = await signInRemoteUser(normalizedEmail, normalizedPassword);
          setBackendAccessToken(session.accessToken);
          setAccessToken(session.accessToken);
          setUser(session.user);
          setIsAuthenticated(true);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Email or password is incorrect.'),
          };
        }
      },
      createProfile: async (profile) => {
        const email = profile.email.trim();
        const password = profile.password.trim();
        const username = profile.username.trim();
        const fullName = profile.fullName.trim();

        if (!email || !password || !username || !fullName) {
          return { ok: false, error: 'Username, full name, email, and password are required.' };
        }

        try {
          const session = await registerRemoteUser({
            username,
            fullName,
            bio: profile.bio.trim(),
            city: profile.city.trim(),
            email,
            password,
            avatarUri: profile.avatarUri.trim(),
          });
          setBackendAccessToken(session.accessToken);
          setAccessToken(session.accessToken);
          setUser(session.user);
          setIsAuthenticated(true);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Unable to create your account right now.'),
          };
        }
      },
      updateProfile: async (profile) => {
        if (!isAuthenticated) {
          return { ok: false, error: 'Sign in to update your profile.' };
        }

        try {
          const updatedUser = await updateRemoteCurrentUser({
            username: profile.username?.trim(),
            fullName: profile.fullName?.trim(),
            bio: profile.bio?.trim(),
            city: profile.city?.trim(),
            email: profile.email?.trim(),
            avatarUri: profile.avatarUri?.trim(),
          });
          setUser(updatedUser);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Unable to update your profile right now.'),
          };
        }
      },
      requestPasswordReset: async (email) => {
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
          return { ok: false, error: 'Enter your email address.' };
        }

        try {
          const response = await requestRemotePasswordReset(normalizedEmail);
          return {
            ok: true,
            challengeId: response.challengeId,
            debugCode: response.debugCode,
            message: response.message,
          };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Unable to request a password reset right now.'),
          };
        }
      },
      confirmPasswordReset: async (challengeId, code, newPassword) => {
        const trimmedChallengeId = challengeId.trim();
        const trimmedCode = code.trim();
        const trimmedPassword = newPassword.trim();

        if (!trimmedChallengeId || !trimmedCode || !trimmedPassword) {
          return { ok: false, error: 'Reset code, challenge ID, and new password are required.' };
        }

        try {
          await confirmRemotePasswordReset(trimmedChallengeId, trimmedCode, trimmedPassword);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Unable to reset your password right now.'),
          };
        }
      },
      changePassword: async (currentPassword, newPassword) => {
        const trimmedCurrent = currentPassword.trim();
        const trimmedNext = newPassword.trim();

        if (!trimmedCurrent || !trimmedNext) {
          return { ok: false, error: 'Enter your current and new password.' };
        }

        if (trimmedNext.length < 6) {
          return { ok: false, error: 'New password must be at least 6 characters.' };
        }

        try {
          await changeRemotePassword(trimmedCurrent, trimmedNext);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Unable to change your password right now.'),
          };
        }
      },
      deleteAccount: async () => {
        if (!isAuthenticated) {
          return { ok: false, error: 'Sign in to delete your account.' };
        }

        try {
          await deleteRemoteCurrentUser();
          setBackendAccessToken(null);
          setAccessToken(null);
          setUser(DEFAULT_USER);
          setIsAuthenticated(false);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error: normalizeError(error, 'Unable to delete your account right now.'),
          };
        }
      },
      signOut: () => {
        setBackendAccessToken(null);
        setAccessToken(null);
        setUser(DEFAULT_USER);
        setIsAuthenticated(false);
        void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {
          // Ignore cleanup failures.
        });
      },
    }),
    [accessToken, hasHydrated, isAuthenticated, user]
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
