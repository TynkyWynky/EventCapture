import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { EVENT_RECORDS, EventRecord } from '@/constants/events';
import { fetchRemoteEvents, upsertRemoteEvent } from '@/services/appDataApi';

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
  createEvent: (input: CreateEventInput) => EventRecord;
  updateEvent: (eventId: string, updates: Partial<EventRecord>) => EventRecord | undefined;
  deleteEvent: (eventId: string) => void;
  getEventById: (eventId?: string | string[]) => EventRecord | undefined;
}

const STORAGE_KEY = 'eventcapture.events';
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

function parseStoredEvents(rawValue: string | null): EventRecord[] | null {
  if (!rawValue) {
    return null;
  }

  const parsedValue = JSON.parse(rawValue) as unknown;

  if (!Array.isArray(parsedValue)) {
    return null;
  }

  return parsedValue.filter(isValidEventRecord);
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
  const [events, setEvents] = useState<EventRecord[]>(EVENT_RECORDS);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedEvents = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedEvents = parseStoredEvents(storedEvents);

        if (!parsedEvents || !parsedEvents.length || !isMounted) {
          return;
        }

        setEvents(mergeEventCollections(parsedEvents, EVENT_RECORDS));
      } catch {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore cleanup failures and keep seed events in memory.
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events)).catch(() => {
      // Keep the app usable even if persistence is unavailable.
    });
  }, [events, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let isMounted = true;

    fetchRemoteEvents()
      .then((remoteEvents) => {
        if (!isMounted || !remoteEvents.length) {
          return;
        }

        setEvents((prev) => mergeEventCollections(remoteEvents, prev, EVENT_RECORDS));
      })
      .catch(() => {
        // Keep the app responsive even when the backend is offline.
      });

    return () => {
      isMounted = false;
    };
  }, [hasHydrated]);

  const value = useMemo<EventContextType>(() => {
    const featuredEventId = events[0]?.id ?? '';

    return {
      events,
      featuredEventId,
      createEvent: (input) => {
        const trimmedTitle = input.title.trim();
        const eventTitle = trimmedTitle || 'Untitled Event';
        const eventId = `${eventTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}-${Date.now().toString().slice(-6)}`;

        const newEvent: EventRecord = {
          id: eventId,
          title: eventTitle,
          shortTitle: 'Freshly created event',
          date: input.date.trim() || 'TBD',
          fullDate: input.fullDate.trim() || input.date.trim() || 'Date to be confirmed',
          time: input.time.trim() || 'Time to be confirmed',
          place: input.place.trim() || 'Brussels',
          address: input.address.trim() || input.place.trim() || 'Location to be confirmed',
          attendees: '0 going',
          attendeeCount: 0,
          price: input.price.trim() || 'Free',
          priceLabel: input.priceLabel.trim() || input.price.trim() || 'Free entry',
          vibe: input.vibe.trim() || 'Atmosphere to be announced',
          experience: 'Hosted event',
          heroImage: input.heroImage.trim() || EVENT_RECORDS[0]?.heroImage || '',
          hostName: 'You',
          hostAvatar: 'https://i.pravatar.cc/120?img=52',
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

        if (!newEvent.tags.length) {
          newEvent.tags = ['New event', 'Community', 'Live now'];
        }

        setEvents((prev) => mergeEventCollections([newEvent], prev));
        void upsertRemoteEvent(newEvent)
          .then((persistedEvent) => {
            setEvents((prev) =>
              mergeEventCollections(
                [persistedEvent],
                prev.filter((event) => event.id !== persistedEvent.id),
                EVENT_RECORDS
              )
            );
          })
          .catch(() => {
            // Local persistence remains the fallback when the backend is unavailable.
          });
        return newEvent;
      },
      updateEvent: (eventId, updates) => {
        let updatedEvent: EventRecord | undefined;
        setEvents((prev) =>
          prev.map((event) => {
            if (event.id === eventId) {
              updatedEvent = { ...event, ...updates };
              return updatedEvent;
            }
            return event;
          })
        );
        return updatedEvent;
      },
      deleteEvent: (eventId) => {
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
      },
      getEventById: (eventId) => {
        if (!eventId || Array.isArray(eventId)) {
          return undefined;
        }

        return events.find((event) => event.id === eventId);
      },
    };
  }, [events]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }

  return context;
}
