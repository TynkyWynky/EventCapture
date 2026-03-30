import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export interface UserProfile {
  username: string;
  fullName: string;
  bio: string;
  city: string;
  email: string;
  avatarUri: string;
}

interface AccountCredentials {
  email: string;
  password: string;
}

interface UserContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  createProfile: (profile: Omit<UserProfile, 'email'> & { email?: string; password: string }) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetPassword: (email: string, newPassword: string) => { ok: boolean; error?: string };
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
  signOut: () => void;
}

interface StoredUserState {
  user: UserProfile;
  credentials: AccountCredentials;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'eventcapture.user';
const DEFAULT_AVATAR = 'https://i.pravatar.cc/160?img=64';

const DEFAULT_USER: UserProfile = {
  username: 'eventfriend',
  fullName: 'Event Friend',
  bio: 'Capturing nights, collecting crowns and keeping the best event memories close.',
  city: 'Brussels',
  email: 'demo@eventcapture.app',
  avatarUri: DEFAULT_AVATAR,
};

const DEFAULT_CREDENTIALS: AccountCredentials = {
  email: DEFAULT_USER.email,
  password: 'eventcapture123',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function isValidUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as UserProfile;

  return (
    typeof user.username === 'string' &&
    typeof user.fullName === 'string' &&
    typeof user.bio === 'string' &&
    typeof user.city === 'string' &&
    typeof user.email === 'string' &&
    typeof user.avatarUri === 'string'
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

  if (
    !parsedValue.credentials ||
    typeof parsedValue.credentials.email !== 'string' ||
    typeof parsedValue.credentials.password !== 'string'
  ) {
    return null;
  }

  return {
    user: parsedValue.user,
    credentials: parsedValue.credentials,
    isAuthenticated: Boolean(parsedValue.isAuthenticated),
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [credentials, setCredentials] = useState<AccountCredentials>(DEFAULT_CREDENTIALS);
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
        setCredentials(parsedState.credentials);
        setIsAuthenticated(parsedState.isAuthenticated);
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user, credentials, isAuthenticated })).catch(() => {
      // Keep the app usable even if persistence is unavailable.
    });
  }, [credentials, hasHydrated, isAuthenticated, user]);

  const value = useMemo<UserContextType>(
    () => ({
      user,
      isAuthenticated,
      isReady: hasHydrated,
      signIn: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();

        if (!normalizedEmail || !normalizedPassword) {
          return { ok: false, error: 'Enter both email and password.' };
        }

        if (
          normalizedEmail !== credentials.email.toLowerCase() ||
          normalizedPassword !== credentials.password
        ) {
          return { ok: false, error: 'Email or password is incorrect.' };
        }

        setUser((prev) => ({
          ...prev,
          email: credentials.email,
        }));
        setIsAuthenticated(true);
        return { ok: true };
      },
      createProfile: (profile) => {
        const nextEmail = profile.email?.trim() || DEFAULT_USER.email;
        setUser({
          username: profile.username.trim() || DEFAULT_USER.username,
          fullName: profile.fullName.trim() || DEFAULT_USER.fullName,
          bio: profile.bio.trim() || DEFAULT_USER.bio,
          city: profile.city.trim() || DEFAULT_USER.city,
          email: nextEmail,
          avatarUri: profile.avatarUri.trim() || DEFAULT_AVATAR,
        });
        setCredentials({
          email: nextEmail,
          password: profile.password.trim() || DEFAULT_CREDENTIALS.password,
        });
        setIsAuthenticated(true);
      },
      updateProfile: (profile) => {
        setUser((prev) => ({
          ...prev,
          ...profile,
          username: profile.username?.trim() || prev.username,
          fullName: profile.fullName?.trim() || prev.fullName,
          bio: profile.bio?.trim() || prev.bio,
          city: profile.city?.trim() || prev.city,
          email: profile.email?.trim() || prev.email,
          avatarUri: profile.avatarUri?.trim() || prev.avatarUri,
        }));
        if (profile.email?.trim()) {
          setCredentials((prev) => ({
            ...prev,
            email: profile.email.trim(),
          }));
        }
      },
      resetPassword: (email, newPassword) => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedPassword = newPassword.trim();

        if (!normalizedEmail || !trimmedPassword) {
          return { ok: false, error: 'Enter both email and new password.' };
        }

        if (normalizedEmail !== credentials.email.toLowerCase()) {
          return { ok: false, error: 'No account matches that email address.' };
        }

        if (trimmedPassword.length < 6) {
          return { ok: false, error: 'Password must be at least 6 characters.' };
        }

        setCredentials((prev) => ({
          ...prev,
          password: trimmedPassword,
        }));

        return { ok: true };
      },
      changePassword: (currentPassword, newPassword) => {
        const trimmedCurrent = currentPassword.trim();
        const trimmedNext = newPassword.trim();

        if (!trimmedCurrent || !trimmedNext) {
          return { ok: false, error: 'Enter your current and new password.' };
        }

        if (trimmedCurrent !== credentials.password) {
          return { ok: false, error: 'Current password is incorrect.' };
        }

        if (trimmedNext.length < 6) {
          return { ok: false, error: 'New password must be at least 6 characters.' };
        }

        if (trimmedCurrent === trimmedNext) {
          return { ok: false, error: 'Choose a different new password.' };
        }

        setCredentials((prev) => ({
          ...prev,
          password: trimmedNext,
        }));

        return { ok: true };
      },
      signOut: () => {
        setIsAuthenticated(false);
      },
    }),
    [credentials, hasHydrated, isAuthenticated, user]
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
