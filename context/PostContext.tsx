import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveCrownReward, getCrownLevelProgress } from '@/constants/crowns';
import { useToast } from '@/context/ToastContext';
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext, ReactNode } from 'react';

export interface Post {
  id: string;
  imageUri: string;
  date: string;
  isBeerFinished: boolean;
  eventId?: string;
  eventTitle?: string;
}

interface PostContextType {
  posts: Post[];
  crowns: number;
  addPost: (post: Omit<Post, 'id' | 'date'>) => void;
}

interface StoredPostState {
  posts: Post[];
  crowns: number;
}

const PostContext = createContext<PostContextType | undefined>(undefined);
const STORAGE_KEY = 'eventcapture.post-state';
const DEFAULT_POSTS: Post[] = [
  {
    id: 'seed-post-1',
    imageUri: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80',
    date: '18/07/2026',
    isBeerFinished: true,
    eventId: 'afterwork-tasting',
    eventTitle: 'Afterwork Tasting',
  },
  {
    id: 'seed-post-2',
    imageUri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    date: '07/09/2026',
    isBeerFinished: false,
    eventId: 'canal-lights-open-air',
    eventTitle: 'Canal Lights Open Air',
  },
  {
    id: 'seed-post-3',
    imageUri: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=900&q=80',
    date: '20/09/2026',
    isBeerFinished: true,
    eventId: 'park-food-beats',
    eventTitle: 'Park Food & Beats',
  },
];
const DEFAULT_CROWNS = 5;

function isValidPost(value: unknown): value is Post {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const post = value as Post;

  return (
    typeof post.id === 'string' &&
    typeof post.imageUri === 'string' &&
    typeof post.date === 'string' &&
    typeof post.isBeerFinished === 'boolean' &&
    (post.eventId === undefined || typeof post.eventId === 'string') &&
    (post.eventTitle === undefined || typeof post.eventTitle === 'string')
  );
}

function parseStoredState(rawValue: string | null): StoredPostState | null {
  if (!rawValue) {
    return null;
  }

  const parsedValue = JSON.parse(rawValue) as Partial<StoredPostState>;
  const parsedPosts = Array.isArray(parsedValue.posts)
    ? parsedValue.posts.filter(isValidPost)
    : [];
  const parsedCrowns =
    typeof parsedValue.crowns === 'number' && Number.isFinite(parsedValue.crowns)
      ? parsedValue.crowns
      : DEFAULT_CROWNS;

  return {
    posts: parsedPosts,
    crowns: parsedCrowns,
  };
}

export function PostProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>(DEFAULT_POSTS);
  const [crowns, setCrowns] = useState(DEFAULT_CROWNS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [lastAwardedEventTitle, setLastAwardedEventTitle] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedState = parseStoredState(storedState);

        if (!parsedState || !isMounted) {
          return;
        }

        setPosts(parsedState.posts);
        setCrowns(parsedState.crowns);
      } catch (error) {
        try {
          await AsyncStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore cleanup failures and fall back to default in-memory state.
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

    const persistState = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ posts, crowns })
        );
      } catch {
        // Keep the app usable even if device storage is unavailable.
      }
    };

    persistState();
  }, [crowns, hasHydrated, posts]);

  useEffect(() => {
    if (!hasHydrated || !lastAwardedEventTitle) {
      return;
    }

    const previousLevel = getCrownLevelProgress(crowns - 1).currentLevel.level;
    const currentLevel = getCrownLevelProgress(crowns).currentLevel;

    if (currentLevel.level > previousLevel) {
      const activeReward = getActiveCrownReward(crowns);

      showToast({
        title: `Level up! You're now Level ${currentLevel.level}`,
        message: activeReward
          ? `${currentLevel.title} unlocked after ${lastAwardedEventTitle}. New perk: ${activeReward.reward.perk}.`
          : `${currentLevel.title} unlocked after ${lastAwardedEventTitle}.`,
        tone: 'success',
      });
    }

    setLastAwardedEventTitle(null);
  }, [crowns, hasHydrated, lastAwardedEventTitle, showToast]);

  const addPost = useCallback((newPostData: Omit<Post, 'id' | 'date'>) => {
    const newPost: Post = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      ...newPostData,
    };

    setPosts((prev) => [newPost, ...prev]);

    if (newPostData.isBeerFinished) {
      setLastAwardedEventTitle(newPostData.eventTitle ?? 'your latest capture');
      setCrowns((prev) => prev + 1);
    }
  }, []);

  const value = useMemo(
    () => ({ posts, crowns, addPost }),
    [posts, crowns, addPost]
  );

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
}
