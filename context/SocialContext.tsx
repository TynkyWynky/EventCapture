import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { isRemovedSeedEventId } from '@/constants/events';
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
import { connectNotificationsRealtime, NotificationSocketConnection } from '@/services/notificationsRealtimeApi';

export type { EventPlanStatus };

export interface ActivityItem {
  id: string;
  actorUserId?: string | null;
  user: string;
  text: string;
  title?: string;
  time: string;
  icon: string;
  color: string;
  createdAt: string;
  avatarUri?: string;
  relatedType?: string | null;
  relatedId?: string | null;
  isRead?: boolean;
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
  realtimeStatus: 'connecting' | 'connected' | 'reconnecting';
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

function sanitizeSocialStateMap(value: SocialStateMap): SocialStateMap {
  return Object.fromEntries(
    Object.entries(value).filter(([eventId]) => !isRemovedSeedEventId(eventId))
  );
}

function mapRemoteNotification(item: {
  id: string;
  actor_username: string;
  actor_avatar_uri: string;
  title: string;
  message: string;
  icon: string;
  color: string;
  created_at: string;
  related_type?: string | null;
  related_id?: string | null;
  is_read?: boolean;
}): ActivityItem {
  return {
    id: item.id,
    actorUserId: item.actor_user_id,
    user: item.actor_username,
    avatarUri: item.actor_avatar_uri,
    title: item.title,
    text: item.message,
    time: timeAgo(item.created_at),
    icon: item.icon,
    color: item.color,
    createdAt: item.created_at,
    relatedType: item.related_type,
    relatedId: item.related_id,
    isRead: item.is_read,
  };
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();
  const { events } = useEvents();
  const [socialState, setSocialState] = useState<SocialStateMap>({});
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<NotificationSocketConnection | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(false);

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

        const sanitizedState = sanitizeSocialStateMap(parsed.socialState ?? {});
        setSocialState(sanitizedState);
        setIsUsingCachedData(Object.keys(sanitizedState).length > 0);
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

  const applyRemoteNotifications = (remoteNotifications: Awaited<ReturnType<typeof fetchNotifications>>) => {
    setNotifications(remoteNotifications.items.map((item) => mapRemoteNotification(item)));
    setUnreadCount(remoteNotifications.unread_count);
  };

  const refreshNotifications = async () => {
    const remoteNotifications = await fetchNotifications();
    applyRemoteNotifications(remoteNotifications);
  };

  const refreshSocial = async () => {
    if (!isAuthenticated) {
      setSocialState({});
      setNotifications([]);
      setUnreadCount(0);
      setRealtimeStatus('connecting');
      setIsUsingCachedData(false);
      setIsOffline(false);
      setError(null);
      return;
    }

    const [remoteSocial, remotePlans, remoteNotifications] = await Promise.all([
      fetchEventSocialMap(),
      fetchPlannedEventsRemote(),
      fetchNotifications(),
    ]);

    const nextState: SocialStateMap = sanitizeSocialStateMap({ ...remoteSocial });
    for (const plan of remotePlans) {
      if (isRemovedSeedEventId(plan.event_id)) {
        continue;
      }

      nextState[plan.event_id] = {
        ...(nextState[plan.event_id] ?? emptySocialState),
        saved: plan.saved,
        planStatus: plan.plan_status ?? null,
        planNote: plan.plan_note ?? '',
      };
    }
    setSocialState(nextState);
    applyRemoteNotifications(remoteNotifications);
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
      setUnreadCount(0);
      setRealtimeStatus('connecting');
      return;
    }

    void refreshSocial().catch((refreshError) => {
      setIsOffline(true);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh activity right now.');
    });
  }, [hasHydrated, isAuthenticated]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      shouldReconnectRef.current = false;
      reconnectAttemptsRef.current = 0;
      setRealtimeStatus('connecting');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    shouldReconnectRef.current = true;
    let isDisposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (!shouldReconnectRef.current || isDisposed || reconnectTimeoutRef.current) {
        return;
      }

      setRealtimeStatus('reconnecting');
      const delayMs = Math.min(30000, 1000 * 2 ** reconnectAttemptsRef.current);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        void connectSocket();
      }, delayMs);
    };

    const connectSocket = async () => {
      if (!shouldReconnectRef.current || isDisposed || socketRef.current) {
        return;
      }

      try {
        setRealtimeStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');
        const connection = await connectNotificationsRealtime({
          onMessage: (message) => {
            if (message.type === 'notification.created') {
              const nextItem = mapRemoteNotification(message.item);
              setNotifications((prev) => {
                if (prev.some((item) => item.id === nextItem.id)) {
                  return prev;
                }
                return [nextItem, ...prev];
              });
              setUnreadCount(message.unread_count);
              return;
            }

            if (message.type === 'notification.read_all') {
              setUnreadCount(message.unread_count);
              setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            }
          },
          onOpen: () => {
            reconnectAttemptsRef.current = 0;
            setRealtimeStatus('connected');
            void refreshNotifications().catch(() => {});
          },
          onClose: () => {
            socketRef.current = null;
            if (shouldReconnectRef.current && !isDisposed) {
              scheduleReconnect();
            }
          },
          onError: () => {
            // Reconnect handling is driven by close events.
          },
        });

        if (isDisposed || !shouldReconnectRef.current) {
          connection.disconnect();
          return;
        }

        clearReconnectTimer();
        socketRef.current = connection;
      } catch {
        scheduleReconnect();
      }
    };

    void connectSocket();

    return () => {
      isDisposed = true;
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
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
            actorUserId: created.actor_user_id,
            user: created.actor_username,
            avatarUri: created.actor_avatar_uri,
            title: created.title,
            text: created.message,
            time: timeAgo(created.created_at),
            icon: created.icon,
            color: created.color,
            createdAt: created.created_at,
            relatedType: created.related_type,
            relatedId: created.related_id,
            isRead: created.is_read,
          },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
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
      unreadCount,
      realtimeStatus,
      isUsingCachedData,
      isOffline,
      error,
      markAllRead: async () => {
        await markNotificationsRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
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
  }, [error, events, isOffline, isUsingCachedData, notifications, realtimeStatus, socialState, unreadCount]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);

  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }

  return context;
}
