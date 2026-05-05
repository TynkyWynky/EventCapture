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
import { createActivityNotification, fetchNotifications, markNotificationsRead } from '@/services/notificationsApi';

export type { EventPlanStatus };

export interface ActivityItem {
  id: string;
  user: string;
  text: string;
  time: string;
  icon: string;
  color: string;
  createdAt: string;
  avatarUri?: string;
}

interface SocialContextType {
  getEventSocial: (eventId?: string | string[]) => EventSocialState | undefined;
  toggleEventLike: (eventId: string, eventTitle: string) => Promise<void>;
  toggleEventSave: (eventId: string, eventTitle: string) => Promise<void>;
  setEventPlanStatus: (eventId: string, eventTitle: string, status: EventPlanStatus) => Promise<void>;
  setEventPlanNote: (eventId: string, note: string) => Promise<void>;
  addEventComment: (eventId: string, eventTitle: string, text: string) => Promise<{ ok: boolean; error?: string }>;
  addActivity: (item: Omit<ActivityItem, 'id' | 'createdAt' | 'time'>) => Promise<void>;
  notifications: ActivityItem[];
  unreadCount: number;
  isUsingCachedData: boolean;
  isOffline: boolean;
  error: string | null;
  markAllRead: () => Promise<void>;
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

function timeAgo(timestamp: string) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
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
  const { isAuthenticated } = useUser();
  const { events } = useEvents();
  const [socialState, setSocialState] = useState<SocialStateMap>({});
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        };

        setSocialState(parsed.socialState ?? {});
        setIsUsingCachedData(Object.keys(parsed.socialState ?? {}).length > 0);
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ socialState })).catch(() => {});
  }, [hasHydrated, socialState]);

  const refreshSocial = async () => {
    if (!isAuthenticated) {
      setSocialState({});
      setNotifications([]);
      return;
    }

    const [remoteSocial, remotePlans, remoteNotifications] = await Promise.all([
      fetchEventSocialMap(),
      fetchPlannedEventsRemote(),
      fetchNotifications(),
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
    setNotifications(
      remoteNotifications.items.map((item) => ({
        id: item.id,
        user: item.actor_username,
        avatarUri: item.actor_avatar_uri,
        text: item.message,
        time: timeAgo(item.created_at),
        icon: item.icon,
        color: item.color,
        createdAt: item.created_at,
      }))
    );
    setIsUsingCachedData(false);
    setIsOffline(false);
    setError(null);
  };

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      setSocialState({});
      setNotifications([]);
      return;
    }

    void refreshSocial().catch((refreshError) => {
      setIsOffline(true);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh activity right now.');
    });
  }, [hasHydrated, isAuthenticated]);

  const value = useMemo<SocialContextType>(() => {
    return {
      addActivity: async (item) => {
        const created = await createActivityNotification({
          title: item.text,
          message: item.text,
          icon: item.icon,
          color: item.color,
        });
        setNotifications((prev) => [
          {
            id: created.id,
            user: created.actor_username,
            avatarUri: created.actor_avatar_uri,
            text: created.message,
            time: timeAgo(created.created_at),
            icon: created.icon,
            color: created.color,
            createdAt: created.created_at,
          },
          ...prev,
        ]);
      },
      getEventSocial: (eventId) => {
        if (!eventId || Array.isArray(eventId)) {
          return undefined;
        }

        return socialState[eventId];
      },
      toggleEventLike: async (eventId, _eventTitle) => {
        const nextState = await toggleEventLikeRemote(eventId);
        setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
      },
      toggleEventSave: async (eventId, _eventTitle) => {
        const nextState = await toggleEventSaveRemote(eventId);
        setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
      },
      setEventPlanStatus: async (eventId, _eventTitle, status) => {
        const nextState = await setEventPlanStatusRemote(eventId, status);
        setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
      },
      setEventPlanNote: async (eventId, note) => {
        const nextState = await setEventPlanNoteRemote(eventId, note);
        setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
      },
      addEventComment: async (eventId, _eventTitle, text) => {
        const trimmed = text.trim();
        if (!trimmed) {
          return { ok: false, error: 'Write a comment before sending.' };
        }

        try {
          const nextState = await addEventCommentRemote(eventId, trimmed);
          setSocialState((prev) => ({ ...prev, [eventId]: nextState }));
          return { ok: true };
        } catch (commentError) {
          return {
            ok: false,
            error: commentError instanceof Error ? commentError.message : 'Unable to add that comment right now.',
          };
        }
      },
      notifications: notifications.map((item) => ({
        ...item,
        time: timeAgo(item.createdAt),
      })),
      unreadCount: notifications.length,
      isUsingCachedData,
      isOffline,
      error,
      markAllRead: async () => {
        await markNotificationsRead();
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
  }, [error, events, isOffline, isUsingCachedData, notifications, socialState]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }

  return context;
}
