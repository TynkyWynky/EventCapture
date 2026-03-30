import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { EVENT_RECORDS } from '@/constants/events';
import { useUser } from '@/context/UserContext';

export interface SocialUser {
  id: string;
  name: string;
}

export interface EventComment {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  text: string;
  time: string;
  icon: string;
  color: string;
  createdAt: number;
}

interface EventSocialState {
  liked: boolean;
  saved: boolean;
  likes: SocialUser[];
  comments: EventComment[];
}

interface SocialContextType {
  getEventSocial: (eventId?: string | string[]) => EventSocialState | undefined;
  toggleEventLike: (eventId: string, eventTitle: string) => void;
  toggleEventSave: (eventId: string, eventTitle: string) => void;
  addEventComment: (eventId: string, eventTitle: string, text: string) => { ok: boolean; error?: string };
  addActivity: (item: Omit<ActivityItem, 'id' | 'createdAt' | 'time'>) => void;
  notifications: ActivityItem[];
  getLikedEvents: () => Array<{ eventId: string; eventTitle: string; likedBy: SocialUser[] }>;
}

type SocialStateMap = Record<string, EventSocialState>;

const STORAGE_KEY = 'eventcapture.social';
const seedUsers: SocialUser[] = [
  { id: 'lina', name: 'Lina' },
  { id: 'niels', name: 'Niels' },
  { id: 'emma', name: 'Emma' },
  { id: 'lucas', name: 'Lucas' },
];

function timeAgo(timestamp: number) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return 'Yesterday';
}

function createSeedState(): SocialStateMap {
  const initial: SocialStateMap = {};

  EVENT_RECORDS.forEach((event, index) => {
    initial[event.id] = {
      liked: index === 0,
      saved: index === 0,
      likes: seedUsers.slice(0, Math.min(seedUsers.length, 2 + (index % 2))),
      comments:
        index === 0
          ? [
              { id: `comment-${event.id}-1`, user: 'Lina', text: 'This lineup looks unreal.', time: '12m ago' },
              { id: `comment-${event.id}-2`, user: 'Niels', text: 'Saving this for the weekend crew.', time: '38m ago' },
            ]
          : [],
    };
  });

  return initial;
}

function isValidSocialState(value: unknown): value is SocialStateMap {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return true;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [socialState, setSocialState] = useState<SocialStateMap>(createSeedState);
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const rawState = await AsyncStorage.getItem(STORAGE_KEY);

        if (!rawState) {
          return;
        }

        const parsed = JSON.parse(rawState) as {
          socialState?: SocialStateMap;
          notifications?: ActivityItem[];
        };

        if (isMounted && parsed.socialState && isValidSocialState(parsed.socialState)) {
          setSocialState(parsed.socialState);
          setNotifications(parsed.notifications ?? []);
        }
      } catch {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore cleanup failures and keep seed data.
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ socialState, notifications })).catch(() => {
      // Keep the app usable even if persistence is unavailable.
    });
  }, [hasHydrated, notifications, socialState]);

  const value = useMemo<SocialContextType>(() => {
    const pushNotification = (item: Omit<ActivityItem, 'id' | 'createdAt' | 'time'>) => {
      const createdAt = Date.now();
      setNotifications((prev) => [
        {
          ...item,
          id: `${item.icon}-${createdAt}`,
          createdAt,
          time: timeAgo(createdAt),
        },
        ...prev,
      ]);
    };

    return {
      addActivity: pushNotification,
      getEventSocial: (eventId) => {
        if (!eventId || Array.isArray(eventId)) {
          return undefined;
        }

        return socialState[eventId];
      },
      toggleEventLike: (eventId, eventTitle) => {
        setSocialState((prev) => {
          const current = prev[eventId] ?? { liked: false, saved: false, likes: [], comments: [] };
          const nextLiked = !current.liked;
          const nextLikes = nextLiked
            ? [...current.likes, { id: user.username, name: user.username }]
            : current.likes.filter((entry) => entry.id !== user.username);

          return {
            ...prev,
            [eventId]: {
              ...current,
              liked: nextLiked,
              likes: nextLikes,
            },
          };
        });

        pushNotification({
          user: user.username,
          text: `${!socialState[eventId]?.liked ? 'liked' : 'removed a like from'} ${eventTitle}`,
          icon: 'heart',
          color: '#e45b5b',
        });
      },
      toggleEventSave: (eventId, eventTitle) => {
        setSocialState((prev) => {
          const current = prev[eventId] ?? { liked: false, saved: false, likes: [], comments: [] };

          return {
            ...prev,
            [eventId]: {
              ...current,
              saved: !current.saved,
            },
          };
        });

        pushNotification({
          user: user.username,
          text: `${!socialState[eventId]?.saved ? 'saved' : 'unsaved'} ${eventTitle}`,
          icon: 'bookmark-outline',
          color: '#f47b20',
        });
      },
      addEventComment: (eventId, eventTitle, text) => {
        const trimmed = text.trim();

        if (!trimmed) {
          return { ok: false, error: 'Write a comment before sending.' };
        }

        const createdAt = Date.now();

        setSocialState((prev) => {
          const current = prev[eventId] ?? { liked: false, saved: false, likes: [], comments: [] };

          return {
            ...prev,
            [eventId]: {
              ...current,
              comments: [
                {
                  id: `comment-${eventId}-${createdAt}`,
                  user: user.username,
                  text: trimmed,
                  time: timeAgo(createdAt),
                },
                ...current.comments,
              ],
            },
          };
        });

        pushNotification({
          user: user.username,
          text: `commented on ${eventTitle}`,
          icon: 'chatbubble-ellipses-outline',
          color: '#0f766e',
        });

        return { ok: true };
      },
      notifications: notifications.map((item) => ({
        ...item,
        time: timeAgo(item.createdAt),
      })),
      getLikedEvents: () =>
        EVENT_RECORDS.map((event) => ({
          eventId: event.id,
          eventTitle: event.title,
          likedBy: socialState[event.id]?.likes ?? [],
        })).filter((entry) => entry.likedBy.length > 0),
    };
  }, [notifications, socialState, user.username]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }

  return context;
}
