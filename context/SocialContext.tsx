import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  containsRemovedSeedEventTitle,
  EventRecord,
  isRemovedSeedEventId,
} from '@/constants/events';
import { useEvents } from '@/context/EventContext';
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

export type EventPlanStatus = 'going' | 'maybe' | 'skip' | null;

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
  planStatus: EventPlanStatus;
  planNote: string;
}

interface SocialContextType {
  getEventSocial: (eventId?: string | string[]) => EventSocialState | undefined;
  toggleEventLike: (eventId: string, eventTitle: string) => void;
  toggleEventSave: (eventId: string, eventTitle: string) => void;
  setEventPlanStatus: (eventId: string, eventTitle: string, status: EventPlanStatus) => void;
  setEventPlanNote: (eventId: string, note: string) => void;
  addEventComment: (eventId: string, eventTitle: string, text: string) => { ok: boolean; error?: string };
  addActivity: (item: Omit<ActivityItem, 'id' | 'createdAt' | 'time'>) => void;
  notifications: ActivityItem[];
  unreadCount: number;
  markAllRead: () => void;
  getLikedEvents: () => { eventId: string; eventTitle: string; likedBy: SocialUser[] }[];
  getPlannedEvents: () => {
    eventId: string;
    saved: boolean;
    planStatus: EventPlanStatus;
    planNote: string;
  }[];
}

type SocialStateMap = Record<string, EventSocialState>;

const STORAGE_KEY = 'eventcapture.social';
const seedUsers: SocialUser[] = [
  { id: 'lina', name: 'Lina' },
  { id: 'niels', name: 'Niels' },
  { id: 'emma', name: 'Emma' },
  { id: 'lucas', name: 'Lucas' },
  { id: 'zoe', name: 'Zoe' },
  { id: 'milan', name: 'Milan' },
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

function buildSeedState(events: EventRecord[]): SocialStateMap {
  const initial: SocialStateMap = {};

  events.slice(0, 6).forEach((event, index) => {
    initial[event.id] = {
      liked: index === 0 || index === 2,
      saved: index === 0 || index === 3,
      likes: seedUsers.slice(0, Math.min(seedUsers.length, 2 + (index % 3))),
      planStatus: index === 0 ? 'going' : index === 3 ? 'maybe' : null,
      planNote:
        index === 0
          ? 'Meet the crew near the entrance around 21:15.'
          : index === 3
            ? 'Good backup if the rooftop plan fills up.'
            : '',
      comments: [
        {
          id: `comment-${event.id}-1`,
          user: seedUsers[index % seedUsers.length].name,
          text:
            index % 2 === 0
              ? 'This one already feels like a strong night.'
              : 'Adding this to the crew plan immediately.',
          time: `${12 + index * 6}m ago`,
        },
        {
          id: `comment-${event.id}-2`,
          user: seedUsers[(index + 1) % seedUsers.length].name,
          text:
            index % 2 === 0
              ? 'The vibe and timing are perfect.'
              : 'This looks way better than most of the city listings.',
          time: `${28 + index * 5}m ago`,
        },
      ],
    };
  });

  return initial;
}

function buildSeedNotifications(events: EventRecord[]): ActivityItem[] {
  const now = Date.now();
  const [firstEvent, secondEvent, thirdEvent] = events;

  if (!firstEvent || !secondEvent || !thirdEvent) {
    return [];
  }

  return [
    {
      id: 'seed-activity-1',
      user: 'Lina',
      text: `liked ${firstEvent.title}`,
      icon: 'heart',
      color: '#e45b5b',
      createdAt: now - 18 * 60 * 1000,
      time: '18m ago',
    },
    {
      id: 'seed-activity-2',
      user: 'Emma',
      text: `commented on ${secondEvent.title}`,
      icon: 'chatbubble-ellipses-outline',
      color: '#0f766e',
      createdAt: now - 46 * 60 * 1000,
      time: '46m ago',
    },
    {
      id: 'seed-activity-3',
      user: 'Milan',
      text: `saved ${thirdEvent.title}`,
      icon: 'bookmark-outline',
      color: '#f47b20',
      createdAt: now - 90 * 60 * 1000,
      time: '2h ago',
    },
  ];
}

function sanitizeSocialStateMap(value: SocialStateMap): SocialStateMap {
  return Object.fromEntries(
    Object.entries(value).filter(([eventId]) => !isRemovedSeedEventId(eventId))
  );
}

function sanitizeNotifications(notifications: ActivityItem[]): ActivityItem[] {
  return notifications.filter((item) => !containsRemovedSeedEventTitle(item.text));
}

function isValidSocialState(value: unknown): value is SocialStateMap {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return true;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { events } = useEvents();
  const { user } = useUser();
  const [socialState, setSocialState] = useState<SocialStateMap>(() => buildSeedState(events));
  const [notifications, setNotifications] = useState<ActivityItem[]>(() =>
    buildSeedNotifications(events)
  );
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
          setSocialState(sanitizeSocialStateMap(parsed.socialState));
          setNotifications(
            Array.isArray(parsed.notifications)
              ? sanitizeNotifications(parsed.notifications)
              : []
          );
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
          const current = prev[eventId] ?? {
            liked: false,
            saved: false,
            likes: [],
            comments: [],
            planStatus: null,
            planNote: '',
          };
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
          const current = prev[eventId] ?? {
            liked: false,
            saved: false,
            likes: [],
            comments: [],
            planStatus: null,
            planNote: '',
          };
          const nextSaved = !current.saved;

          return {
            ...prev,
            [eventId]: {
              ...current,
              saved: nextSaved,
              planStatus: nextSaved ? current.planStatus : null,
              planNote: nextSaved ? current.planNote : '',
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
      setEventPlanStatus: (eventId, eventTitle, status) => {
        setSocialState((prev) => {
          const current = prev[eventId] ?? {
            liked: false,
            saved: false,
            likes: [],
            comments: [],
            planStatus: null,
            planNote: '',
          };

          return {
            ...prev,
            [eventId]: {
              ...current,
              saved: status ? true : current.saved,
              planStatus: status,
            },
          };
        });

        pushNotification({
          user: user.username,
          text:
            status === 'going'
              ? `is going to ${eventTitle}`
              : status === 'maybe'
                ? `added ${eventTitle} as maybe`
                : `removed ${eventTitle} from the night plan`,
          icon: status === 'going' ? 'calendar' : status === 'maybe' ? 'time-outline' : 'close-circle-outline',
          color: status === 'going' ? '#0f766e' : status === 'maybe' ? '#f47b20' : '#857a72',
        });
      },
      setEventPlanNote: (eventId, note) => {
        setSocialState((prev) => {
          const current = prev[eventId] ?? {
            liked: false,
            saved: false,
            likes: [],
            comments: [],
            planStatus: null,
            planNote: '',
          };

          return {
            ...prev,
            [eventId]: {
              ...current,
              saved: true,
              planNote: note.trim(),
            },
          };
        });
      },
      addEventComment: (eventId, eventTitle, text) => {
        const trimmed = text.trim();

        if (!trimmed) {
          return { ok: false, error: 'Write a comment before sending.' };
        }

        const createdAt = Date.now();

        setSocialState((prev) => {
          const current = prev[eventId] ?? {
            liked: false,
            saved: false,
            likes: [],
            comments: [],
            planStatus: null,
            planNote: '',
          };

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
      unreadCount: notifications.length,
      markAllRead: () => {
        setNotifications([]);
      },
      getLikedEvents: () =>
        events.map((event) => ({
          eventId: event.id,
          eventTitle: event.title,
          likedBy: socialState[event.id]?.likes ?? [],
        })).filter((entry) => entry.likedBy.length > 0),
      getPlannedEvents: () =>
        Object.entries(socialState)
          .map(([eventId, state]) => ({
            eventId,
            saved: state.saved,
            planStatus: state.planStatus,
            planNote: state.planNote,
          }))
          .filter((entry) => entry.saved || entry.planStatus),
    };
  }, [events, notifications, socialState, user.username]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }

  return context;
}
