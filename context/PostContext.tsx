import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext, ReactNode } from 'react';

import { getActiveCrownReward, getCrownLevelProgress } from '@/constants/crowns';
import { Post, PostUser } from '@/constants/posts';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import {
  addRemotePostComment,
  deleteRemotePost,
  fetchRemotePosts,
  toggleRemotePostLike,
  upsertRemotePost,
} from '@/services/appDataApi';

interface PostContextType {
  posts: Post[];
  crowns: number;
  isLoading: boolean;
  isUsingCachedData: boolean;
  isOffline: boolean;
  error: string | null;
  addPost: (post: Omit<Post, 'id' | 'date' | 'likes' | 'comments'>) => Promise<{ ok: boolean; error?: string; crownAwarded?: boolean }>;
  togglePostLike: (postId: string) => Promise<void>;
  addPostComment: (postId: string, user: PostUser, text: string) => Promise<{ ok: boolean; error?: string }>;
  deletePost: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);
const STORAGE_KEY = 'eventcapture.post-cache';

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
    typeof post.user === 'object' &&
    Array.isArray(post.likes) &&
    Array.isArray(post.comments) &&
    (post.captureId === undefined || typeof post.captureId === 'string') &&
    (post.eventId === undefined || typeof post.eventId === 'string') &&
    (post.eventTitle === undefined || typeof post.eventTitle === 'string')
  );
}

function parseStoredState(rawValue: string | null): Post[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsedValue) ? parsedValue.filter(isValidPost) : [];
  } catch {
    return [];
  }
}

function mergePostCollections(...collections: Post[][]): Post[] {
  const merged: Post[] = [];
  const seenIds = new Set<string>();

  for (const collection of collections) {
    for (const post of collection) {
      if (!isValidPost(post) || seenIds.has(post.id)) {
        continue;
      }

      seenIds.add(post.id);
      merged.push(post);
    }
  }

  return merged;
}

export function PostProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const { user, refreshCurrentUser } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAwardedEventTitle, setLastAwardedEventTitle] = useState<string | null>(null);
  const crowns = user.crownCount;

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedPosts = parseStoredState(storedState);
        if (!isMounted) {
          return;
        }
        setPosts(parsedPosts);
        setIsUsingCachedData(parsedPosts.length > 0);
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts)).catch(() => {});
  }, [hasHydrated, posts]);

  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const remotePosts = await fetchRemotePosts();
      setPosts(remotePosts as Post[]);
      setIsUsingCachedData(false);
      setIsOffline(false);
      setError(null);
    } catch (refreshError) {
      setIsOffline(true);
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to load posts right now.');
      throw refreshError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void refreshPosts().catch(() => {});
  }, [hasHydrated, refreshPosts]);

  useEffect(() => {
    if (!hasHydrated || !lastAwardedEventTitle) {
      return;
    }

    const previousLevel = getCrownLevelProgress(Math.max(crowns - 1, 0)).currentLevel.level;
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

  const addPost = useCallback(async (newPostData: Omit<Post, 'id' | 'date' | 'likes' | 'comments'>) => {
    const pendingPost: Post = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      ...newPostData,
      likes: [],
      comments: [],
    };
    try {
      const persistedPost = await upsertRemotePost(pendingPost);
      setPosts((prev) =>
        mergePostCollections([persistedPost as Post], prev.filter((post) => post.id !== pendingPost.id && post.id !== persistedPost.id))
      );
      setIsUsingCachedData(false);
      setIsOffline(false);
      setError(null);

      if (persistedPost.crownCount !== undefined) {
        if (persistedPost.crownAwarded) {
          setLastAwardedEventTitle(newPostData.eventTitle ?? 'your latest capture');
        }
        await refreshCurrentUser();
      }

      return { ok: true, crownAwarded: Boolean(persistedPost.crownAwarded) };
    } catch (addError) {
      setIsOffline(true);
      setError(addError instanceof Error ? addError.message : 'Unable to publish this post right now.');
      return {
        ok: false,
        error: addError instanceof Error ? addError.message : 'Unable to publish this post right now.',
      };
    }
  }, [refreshCurrentUser]);

  const togglePostLike = useCallback(async (postId: string) => {
    const persistedPost = await toggleRemotePostLike(postId);
    setPosts((prev) =>
      mergePostCollections([persistedPost as Post], prev.filter((post) => post.id !== postId))
    );
    setIsUsingCachedData(false);
    setIsOffline(false);
    setError(null);
  }, []);

  const addPostComment = useCallback(async (postId: string, _user: PostUser, text: string) => {
    if (!text.trim()) {
      return { ok: false, error: 'Write a comment before sending.' };
    }

    try {
      const persistedPost = await addRemotePostComment(postId, text.trim());
      setPosts((prev) =>
        mergePostCollections([persistedPost as Post], prev.filter((post) => post.id !== postId))
      );
      setIsUsingCachedData(false);
      setIsOffline(false);
      setError(null);
      return { ok: true };
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : 'The comment could not be saved.';
      setIsOffline(true);
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    await deleteRemotePost(postId);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setIsUsingCachedData(false);
    setIsOffline(false);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      posts,
      crowns,
      isLoading,
      isUsingCachedData,
      isOffline,
      error,
      addPost,
      togglePostLike,
      addPostComment,
      deletePost,
      refreshPosts,
    }),
    [posts, crowns, isLoading, isUsingCachedData, isOffline, error, addPost, togglePostLike, addPostComment, deletePost, refreshPosts]
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
