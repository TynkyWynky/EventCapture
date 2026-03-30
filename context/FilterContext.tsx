import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { EventRecord } from '@/constants/events';
import { useEvents } from '@/context/EventContext';

type DateFilter = 'all' | 'today' | 'tomorrow' | 'this_week';
type SortFilter = 'popular' | 'soonest' | 'lowest_price';
type FilterPresetId = 'all' | 'tonight' | 'popular' | 'cheapest' | 'open_air';

interface FiltersState {
  searchQuery: string;
  selectedGenres: string[];
  dateFilter: DateFilter;
  sortBy: SortFilter;
  location: string;
  minPrice: number;
  maxPrice: number;
}

interface FilterContextType {
  filters: FiltersState;
  filteredEvents: EventRecord[];
  activeFilterCount: number;
  activePresetId: FilterPresetId | null;
  favoritePresetId: FilterPresetId | null;
  setSearchQuery: (query: string) => void;
  toggleGenre: (genre: string) => void;
  setDateFilter: (filter: DateFilter) => void;
  setSortBy: (sortBy: SortFilter) => void;
  setLocation: (location: string) => void;
  setPriceRange: (minPrice: number, maxPrice: number) => void;
  applyPreset: (presetId: FilterPresetId) => void;
  toggleFavoritePreset: (presetId: FilterPresetId) => void;
  resetFilters: () => void;
}

const STORAGE_KEY = 'eventcapture.filters';
const DEFAULT_FILTERS: FiltersState = {
  searchQuery: '',
  selectedGenres: [],
  dateFilter: 'all',
  sortBy: 'popular',
  location: 'Brussels, Belgium',
  minPrice: 0,
  maxPrice: 120,
};

const FILTER_PRESETS: Record<FilterPresetId, Partial<FiltersState>> = {
  all: { ...DEFAULT_FILTERS },
  tonight: { dateFilter: 'today', sortBy: 'soonest' },
  popular: { sortBy: 'popular' },
  cheapest: { sortBy: 'lowest_price', minPrice: 0, maxPrice: 15 },
  open_air: { selectedGenres: ['Open air'] },
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

function sortEvents(events: EventRecord[], sortBy: SortFilter) {
  const sorted = [...events];

  if (sortBy === 'soonest') {
    return sorted.sort((a, b) => {
      const aDate = parseEventDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate = parseEventDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return aDate - bDate;
    });
  }

  if (sortBy === 'lowest_price') {
    return sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  }

  return sorted.sort((a, b) => b.attendeeCount - a.attendeeCount);
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
    typeof filters.sortBy === 'string' &&
    typeof filters.searchQuery === 'string' &&
    typeof filters.location === 'string' &&
    typeof filters.minPrice === 'number' &&
    typeof filters.maxPrice === 'number'
  );
}

function isValidPresetId(value: unknown): value is FilterPresetId {
  return typeof value === 'string' && value in FILTER_PRESETS;
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const { events } = useEvents();
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [favoritePresetId, setFavoritePresetId] = useState<FilterPresetId | null>(null);
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
        const parsedState =
          parsedFilters &&
          typeof parsedFilters === 'object' &&
          'filters' in parsedFilters
            ? (parsedFilters as { filters?: unknown; favoritePresetId?: unknown })
            : null;

        if (isMounted && parsedState && isValidFiltersState(parsedState.filters)) {
          setFilters(parsedState.filters);
          if (isValidPresetId(parsedState.favoritePresetId)) {
            setFavoritePresetId(parsedState.favoritePresetId);
          }
          return;
        }

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

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        filters,
        favoritePresetId,
      })
    ).catch(() => {
      // Keep the app usable even if persistence is unavailable.
    });
  }, [favoritePresetId, filters, hasHydrated]);

  const value = useMemo<FilterContextType>(() => {
    const matchingEvents = events.filter((event) => {
      const searchQuery = normalize(filters.searchQuery);
      const searchableFields = [
        event.title,
        event.shortTitle ?? '',
        event.description,
        event.place,
        event.address,
        event.vibe,
        event.experience,
        event.hostName,
        ...event.tags,
      ];
      const hasSearchMatch =
        !searchQuery ||
        searchableFields.some((value) => normalize(value).includes(searchQuery));
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

      return (
        hasSearchMatch &&
        hasGenreMatch &&
        hasLocationMatch &&
        isWithinPrice &&
        isWithinDateFilter(event, filters.dateFilter)
      );
    });
    const filteredEvents = sortEvents(matchingEvents, filters.sortBy);

    const activeFilterCount =
      (filters.searchQuery.trim() ? 1 : 0) +
      filters.selectedGenres.length +
      (filters.dateFilter !== 'all' ? 1 : 0) +
      (filters.sortBy !== DEFAULT_FILTERS.sortBy ? 1 : 0) +
      (normalize(filters.location) !== normalize(DEFAULT_FILTERS.location) ? 1 : 0) +
      (filters.minPrice !== DEFAULT_FILTERS.minPrice || filters.maxPrice !== DEFAULT_FILTERS.maxPrice ? 1 : 0);

    const activePresetId =
      (Object.entries(FILTER_PRESETS).find(([presetId, preset]) => {
        if (presetId === 'all') {
          return (
            !filters.searchQuery.trim() &&
            !filters.selectedGenres.length &&
            filters.dateFilter === DEFAULT_FILTERS.dateFilter &&
            filters.sortBy === DEFAULT_FILTERS.sortBy &&
            normalize(filters.location) === normalize(DEFAULT_FILTERS.location) &&
            filters.minPrice === DEFAULT_FILTERS.minPrice &&
            filters.maxPrice === DEFAULT_FILTERS.maxPrice
          );
        }

        return Object.entries(preset).every(([key, value]) => {
          const filterValue = filters[key as keyof FiltersState];

          if (Array.isArray(value) && Array.isArray(filterValue)) {
            return value.length === filterValue.length && value.every((entry, index) => entry === filterValue[index]);
          }

          return filterValue === value;
        });
      })?.[0] as FilterPresetId | undefined) ?? null;

    return {
      filters,
      filteredEvents,
      activeFilterCount,
      activePresetId,
      favoritePresetId,
      setSearchQuery: (searchQuery) => {
        setFilters((prev) => ({ ...prev, searchQuery }));
      },
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
      setSortBy: (sortBy) => {
        setFilters((prev) => ({ ...prev, sortBy }));
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
      applyPreset: (presetId) => {
        const preset = FILTER_PRESETS[presetId];

        setFilters((prev) => ({
          ...DEFAULT_FILTERS,
          ...prev,
          ...preset,
          searchQuery: presetId === 'all' ? '' : prev.searchQuery,
          location: presetId === 'all' ? DEFAULT_FILTERS.location : prev.location,
        }));
      },
      toggleFavoritePreset: (presetId) => {
        setFavoritePresetId((prev) => (prev === presetId ? null : presetId));
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
