import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  areEventCollectionsEqual,
  EVENT_RECORDS,
  EventRecord,
  filterEventRecordsForDiscovery,
  isRemovedSeedEventId,
} from '@/constants/events';
import { useUser } from '@/context/UserContext';
import { deleteRemoteEvent, fetchRemoteEvents, upsertRemoteEvent } from '@/services/appDataApi';

interface CreateEventInput {
  title: string;
  description: string;
  address: string;
  place: string;
  date: string;
  fullDate: string;
  time: string;
  vibe: string;
  price: string;
  priceLabel: string;
  heroImage: string;
}

interface EventContextType {
  events: EventRecord[];
  featuredEventId: string;
  isLoading: boolean;
  isUsingCachedData: boolean;
  isOffline: boolean;
  error: string | null;
  createEvent: (input: CreateEventInput) => Promise<EventRecord>;
  updateEvent: (eventId: string, updates: Partial<EventRecord>) => Promise<EventRecord | undefined>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventById: (eventId?: string | string[]) => EventRecord | undefined;
  refreshEvents: () => Promise<void>;
}

const STORAGE_KEY = 'eventcapture.events.cache';
const EventContext = createContext<EventContextType | undefined>(undefined);

function isValidEventRecord(value: unknown): value is EventRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const event = value as EventRecord;
  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string' &&
    typeof event.fullDate === 'string' &&
    typeof event.time === 'string' &&
    typeof event.place === 'string' &&
    typeof event.address === 'string' &&
    typeof event.attendees === 'string' &&
    typeof event.attendeeCount === 'number' &&
    typeof event.price === 'string' &&
    typeof event.priceLabel === 'string' &&
    typeof event.vibe === 'string' &&
    typeof event.experience === 'string' &&
    typeof event.heroImage === 'string' &&
    typeof event.hostName === 'string' &&
    typeof event.hostAvatar === 'string' &&
    typeof event.badge === 'string' &&
    typeof event.description === 'string' &&
    Array.isArray(event.tags)
  );
}

function parseStoredEvents(rawValue: string | null): EventRecord[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (event): event is EventRecord =>
            isValidEventRecord(event) && !isRemovedSeedEventId(event.id)
        )
      : [];
  } catch {
    return [];
  }
}

function mergeEventCollections(...collections: EventRecord[][]): EventRecord[] {
  const merged: EventRecord[] = [];
  const seenIds = new Set<string>();

  for (const collection of collections) {
    for (const event of collection) {
      if (!isValidEventRecord(event) || seenIds.has(event.id)) {
        continue;
      }
      seenIds.add(event.id);
      merged.push(event);
    }
  }

  return merged;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useUser();
  const [allEvents, setAllEvents] = useState<EventRecord[]>(EVENT_RECORDS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const events = useMemo(() => filterEventRecordsForDiscovery(allEvents), [allEvents]);

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) {
          return;
        }

        const cachedEvents = parseStoredEvents(storedEvents);
        const mergedEvents = mergeEventCollections(cachedEvents, EVENT_RECORDS);
        setAllEvents(mergedEvents);
        setIsUsingCachedData(
          cachedEvents.length > 0 && !areEventCollectionsEqual(mergedEvents, EVENT_RECORDS)
        );
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

    if (areEventCollectionsEqual(allEvents, EVENT_RECORDS)) {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allEvents)).catch(() => {});
  }, [allEvents, hasHydrated]);

  const refreshEvents = async () => {
    setIsLoading(true);
    try {
      const remoteEvents = await fetchRemoteEvents();
      setAllEvents(
        remoteEvents.length > 0
          ? mergeEventCollections(remoteEvents, EVENT_RECORDS)
          : EVENT_RECORDS
      );
      setIsUsingCachedData(false);
      setIsOffline(false);
      setError(null);
    } catch (refreshError) {
      setIsOffline(true);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to load events right now.');
      throw refreshError;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void refreshEvents().catch(() => {});
  }, [hasHydrated]);

  const value = useMemo<EventContextType>(() => {
    const featuredEventId = events[0]?.id ?? '';

    return {
      events,
      featuredEventId,
      isLoading,
      isUsingCachedData,
      isOffline,
      error,
      createEvent: async (input) => {
        if (!isAuthenticated) {
          throw new Error('Sign in to create an event.');
        }

        const trimmedTitle = input.title.trim();
        const eventTitle = trimmedTitle || 'Untitled Event';
        const draftEvent: EventRecord = {
          id: `${eventTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}-${Date.now().toString().slice(-6)}`,
          title: eventTitle,
          shortTitle: 'Freshly created event',
          date: input.date.trim() || 'TBD',
          fullDate: input.fullDate.trim() || input.date.trim() || 'Date to be confirmed',
          time: input.time.trim() || 'Time to be confirmed',
          place: input.place.trim() || user.city || 'Brussels',
          address: input.address.trim() || input.place.trim() || 'Location to be confirmed',
          attendees: '0 going',
          attendeeCount: 0,
          price: input.price.trim() || 'Free',
          priceLabel: input.priceLabel.trim() || input.price.trim() || 'Free entry',
          vibe: input.vibe.trim() || 'Atmosphere to be announced',
          experience: 'Hosted event',
          heroImage:
            input.heroImage.trim() || allEvents[0]?.heroImage || EVENT_RECORDS[0]?.heroImage || '',
          hostName: user.fullName || user.username,
          hostAvatar: user.avatarUri,
          badge: 'JUST ADDED',
          description:
            input.description.trim() ||
            'A newly created event waiting for its first guests.',
          tags: input.vibe
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 4),
        };

        if (!draftEvent.tags.length) {
          draftEvent.tags = ['New event', 'Community', 'Live now'];
        }

        const persistedEvent = await upsertRemoteEvent(draftEvent);
        setAllEvents((prev) =>
          mergeEventCollections(
            [persistedEvent],
            prev.filter((item) => item.id !== persistedEvent.id)
          )
        );
        setIsUsingCachedData(false);
        setIsOffline(false);
        setError(null);
        return persistedEvent;
      },
      updateEvent: async (eventId, updates) => {
        const current = allEvents.find((event) => event.id === eventId);
        if (!current) {
          return undefined;
        }

        const nextEvent = { ...current, ...updates };
        const persistedEvent = await upsertRemoteEvent(nextEvent);
        setAllEvents((prev) =>
          mergeEventCollections(
            [persistedEvent],
            prev.filter((event) => event.id !== eventId)
          )
        );
        setIsUsingCachedData(false);
        setIsOffline(false);
        setError(null);
        return persistedEvent;
      },
      deleteEvent: async (eventId) => {
        await deleteRemoteEvent(eventId);
        setAllEvents((prev) => prev.filter((event) => event.id !== eventId));
        setIsUsingCachedData(false);
        setIsOffline(false);
        setError(null);
      },
      getEventById: (eventId) => {
        if (!eventId || Array.isArray(eventId)) {
          return undefined;
        }

        return allEvents.find((event) => event.id === eventId);
      },
      refreshEvents,
    };
  }, [allEvents, error, events, isAuthenticated, isLoading, isOffline, isUsingCachedData, user]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }

  return context;
}
