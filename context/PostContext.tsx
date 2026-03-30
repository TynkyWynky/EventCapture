import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useMemo, useState, useContext, ReactNode } from 'react';

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
const DEFAULT_CROWNS = 3;

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [crowns, setCrowns] = useState(DEFAULT_CROWNS);
  const [hasHydrated, setHasHydrated] = useState(false);

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

  const addPost = (newPostData: Omit<Post, 'id' | 'date'>) => {
    const newPost: Post = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      ...newPostData,
    };

    setPosts((prev) => [newPost, ...prev]);

    if (newPostData.isBeerFinished) {
      setCrowns((prev) => prev + 1);
    }
  };

  const value = useMemo(
    () => ({ posts, crowns, addPost }),
    [posts, crowns]
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
