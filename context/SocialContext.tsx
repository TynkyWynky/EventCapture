import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { useEvents } from '@/context/EventContext';
import { useUser } from '@/context/UserContext';
import {
  addEventCommentRemote,
  EventComment,
  EventPlanStatus,
  EventSocialState,
  fetchEventSocialMap,
  fetchPlannedEventsRemote,
  setEventPlanNoteRemote,
  setEventPlanStatusRemote,
  SocialUser,
  toggleEventLikeRemote,
  toggleEventSaveRemote,
} from '@/services/eventSocialApi';

export type { EventPlanStatus };

export interface ActivityItem {
  id: string;
  user: string;
  text: string;
  time: string;
  icon: string;
  color: string;
  createdAt: number;
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
  refreshSocial: () => Promise<void>;
}

type SocialStateMap = Record<string, EventSocialState>;

const STORAGE_KEY = 'eventcapture.social.cache';
const emptySocialState: EventSocialState = {
  liked: false,
  saved: false,
  likes: [],
  comments: [],
  planStatus: null,
  planNote: '',
};

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

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const { events } = useEvents();
  const [socialState, setSocialState] = useState<SocialStateMap>({});
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const rawState = await AsyncStorage.getItem(STORAGE_KEY);
        if (!rawState || !isMounted) {
          return;
        }

        const parsed = JSON.parse(rawState) as {
          socialState?: SocialStateMap;
          notifications?: ActivityItem[];
        };

        setSocialState(parsed.socialState ?? {});
        setNotifications(Array.isArray(parsed.notifications) ? parsed.notifications : []);
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      } finally {
        if (isMounted) {
          setHasHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ socialState, notifications })).catch(() => {});
  }, [hasHydrated, notifications, socialState]);

  const refreshSocial = async () => {
    if (!isAuthenticated) {
      setSocialState({});
      return;
    }

    const [remoteSocial, remotePlans] = await Promise.all([
      fetchEventSocialMap(),
      fetchPlannedEventsRemote(),
    ]);

    const nextState: SocialStateMap = { ...remoteSocial };
    for (const plan of remotePlans) {
      nextState[plan.event_id] = {
        ...(nextState[plan.event_id] ?? emptySocialState),
        saved: plan.saved,
        planStatus: plan.plan_status ?? null,
        planNote: plan.plan_note ?? '',
      };
    }
    setSocialState(nextState);
  };

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      setSocialState({});
      return;
    }

    void refreshSocial().catch(() => {});
  }, [hasHydrated, isAuthenticated]);

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
        void toggleEventLikeRemote(eventId)
          .then((nextState) => {
            setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
            pushNotification({
              user: user.username,
              text: `${nextState.liked ? 'liked' : 'removed a like from'} ${eventTitle}`,
              icon: 'heart',
              color: '#e45b5b',
            });
          })
          .catch(() => {});
      },
      toggleEventSave: (eventId, eventTitle) => {
        void toggleEventSaveRemote(eventId)
          .then((nextState) => {
            setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
            pushNotification({
              user: user.username,
              text: `${nextState.saved ? 'saved' : 'unsaved'} ${eventTitle}`,
              icon: 'bookmark-outline',
              color: '#f47b20',
            });
          })
          .catch(() => {});
      },
      setEventPlanStatus: (eventId, eventTitle, status) => {
        void setEventPlanStatusRemote(eventId, status)
          .then((nextState) => {
            setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
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
          })
          .catch(() => {});
      },
      setEventPlanNote: (eventId, note) => {
        void setEventPlanNoteRemote(eventId, note)
          .then((nextState) => {
            setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
          })
          .catch(() => {});
      },
      addEventComment: (eventId, eventTitle, text) => {
        const trimmed = text.trim();
        if (!trimmed) {
          return { ok: false, error: 'Write a comment before sending.' };
        }

        void addEventCommentRemote(eventId, trimmed)
          .then((nextState) => {
            setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
            pushNotification({
              user: user.username,
              text: `commented on ${eventTitle}`,
              icon: 'chatbubble-ellipses-outline',
              color: '#0f766e',
            });
          })
          .catch(() => {});

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
        events
          .map((event) => ({
            eventId: event.id,
            eventTitle: event.title,
            likedBy: socialState[event.id]?.likes ?? [],
          }))
          .filter((entry) => entry.likedBy.length > 0),
      getPlannedEvents: () =>
        Object.entries(socialState)
          .map(([eventId, state]) => ({
            eventId,
            saved: state.saved,
            planStatus: state.planStatus,
            planNote: state.planNote,
          }))
          .filter((entry) => entry.saved || entry.planStatus),
      refreshSocial,
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
