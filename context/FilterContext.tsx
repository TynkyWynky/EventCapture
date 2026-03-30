import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { EventRecord } from '@/constants/events';
import { useEvents } from '@/context/EventContext';

type DateFilter = 'all' | 'today' | 'tomorrow' | 'this_week';

interface FiltersState {
  selectedGenres: string[];
  dateFilter: DateFilter;
  location: string;
  minPrice: number;
  maxPrice: number;
}

interface FilterContextType {
  filters: FiltersState;
  filteredEvents: EventRecord[];
  activeFilterCount: number;
  toggleGenre: (genre: string) => void;
  setDateFilter: (filter: DateFilter) => void;
  setLocation: (location: string) => void;
  setPriceRange: (minPrice: number, maxPrice: number) => void;
  resetFilters: () => void;
}

const STORAGE_KEY = 'eventcapture.filters';
const DEFAULT_FILTERS: FiltersState = {
  selectedGenres: [],
  dateFilter: 'all',
  location: 'Brussels, Belgium',
  minPrice: 0,
  maxPrice: 120,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parsePrice(price: string) {
  const match = price.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function parseEventDate(event: EventRecord) {
  const parsed = new Date(event.fullDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinDateFilter(event: EventRecord, dateFilter: DateFilter) {
  if (dateFilter === 'all') {
    return true;
  }

  const eventDate = parseEventDate(event);

  if (!eventDate) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfTomorrow);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 1);
  const startOfNextWeek = new Date(startOfToday);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

  if (dateFilter === 'today') {
    return eventDate >= startOfToday && eventDate < startOfTomorrow;
  }

  if (dateFilter === 'tomorrow') {
    return eventDate >= startOfTomorrow && eventDate < startOfDayAfterTomorrow;
  }

  return eventDate >= startOfToday && eventDate < startOfNextWeek;
}

function isValidFiltersState(value: unknown): value is FiltersState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const filters = value as FiltersState;

  return (
    Array.isArray(filters.selectedGenres) &&
    typeof filters.dateFilter === 'string' &&
    typeof filters.location === 'string' &&
    typeof filters.minPrice === 'number' &&
    typeof filters.maxPrice === 'number'
  );
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { events } = useEvents();
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedFilters = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedFilters) {
          return;
        }

        const parsedFilters = JSON.parse(storedFilters) as unknown;

        if (isMounted && isValidFiltersState(parsedFilters)) {
          setFilters(parsedFilters);
        }
      } catch {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore cleanup failures and keep defaults in memory.
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filters)).catch(() => {
      // Keep the app usable even if persistence is unavailable.
    });
  }, [filters, hasHydrated]);

  const value = useMemo<FilterContextType>(() => {
    const filteredEvents = events.filter((event) => {
      const hasGenreMatch =
        !filters.selectedGenres.length ||
        filters.selectedGenres.some((genre) =>
          [...event.tags, event.vibe, event.experience].some((value) =>
            normalize(value).includes(normalize(genre))
          )
        );
      const hasLocationMatch =
        !filters.location.trim() ||
        normalize(filters.location).includes('brussels') ||
        normalize(event.place).includes(normalize(filters.location)) ||
        normalize(event.address).includes(normalize(filters.location));
      const price = parsePrice(event.price);
      const isWithinPrice = price >= filters.minPrice && price <= filters.maxPrice;

      return hasGenreMatch && hasLocationMatch && isWithinPrice && isWithinDateFilter(event, filters.dateFilter);
    });

    const activeFilterCount =
      filters.selectedGenres.length +
      (filters.dateFilter !== 'all' ? 1 : 0) +
      (normalize(filters.location) !== normalize(DEFAULT_FILTERS.location) ? 1 : 0) +
      (filters.minPrice !== DEFAULT_FILTERS.minPrice || filters.maxPrice !== DEFAULT_FILTERS.maxPrice ? 1 : 0);

    return {
      filters,
      filteredEvents,
      activeFilterCount,
      toggleGenre: (genre) => {
        setFilters((prev) => ({
          ...prev,
          selectedGenres: prev.selectedGenres.includes(genre)
            ? prev.selectedGenres.filter((entry) => entry !== genre)
            : [...prev.selectedGenres, genre],
        }));
      },
      setDateFilter: (dateFilter) => {
        setFilters((prev) => ({ ...prev, dateFilter }));
      },
      setLocation: (location) => {
        setFilters((prev) => ({ ...prev, location }));
      },
      setPriceRange: (minPrice, maxPrice) => {
        setFilters((prev) => ({
          ...prev,
          minPrice: Math.max(0, Math.min(minPrice, maxPrice)),
          maxPrice: Math.max(minPrice, maxPrice),
        }));
      },
      resetFilters: () => {
        setFilters(DEFAULT_FILTERS);
      },
    };
  }, [events, filters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }

  return context;
}
