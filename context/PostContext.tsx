import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext, ReactNode } from 'react';

import { getActiveCrownReward, getCrownLevelProgress } from '@/constants/crowns';
import { Post, PostComment, PostUser } from '@/constants/posts';
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
  addPost: (post: Omit<Post, 'id' | 'date' | 'likes' | 'comments'>) => void;
  togglePostLike: (postId: string) => void;
  addPostComment: (postId: string, user: PostUser, text: string) => { ok: boolean; error?: string };
  deletePost: (postId: string) => void;
  refreshPosts: () => Promise<void>;
}

interface StoredPostState {
  posts: Post[];
  crowns: number;
}

const PostContext = createContext<PostContextType | undefined>(undefined);
const STORAGE_KEY = 'eventcapture.post-state.cache';
const DEFAULT_CROWNS = 0;

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

function parseStoredState(rawValue: string | null): StoredPostState {
  if (!rawValue) {
    return { posts: [], crowns: DEFAULT_CROWNS };
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<StoredPostState>;
    const parsedPosts = Array.isArray(parsedValue.posts)
      ? parsedValue.posts.filter(isValidPost)
      : [];
    const parsedCrowns =
      typeof parsedValue.crowns === 'number' && Number.isFinite(parsedValue.crowns)
        ? parsedValue.crowns
        : DEFAULT_CROWNS;

    return { posts: parsedPosts, crowns: parsedCrowns };
  } catch {
    return { posts: [], crowns: DEFAULT_CROWNS };
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
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [crowns, setCrowns] = useState(DEFAULT_CROWNS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAwardedEventTitle, setLastAwardedEventTitle] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedState = parseStoredState(storedState);
        if (!isMounted) {
          return;
        }
        setPosts(parsedState.posts);
        setCrowns(parsedState.crowns);
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

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ posts, crowns })).catch(() => {});
  }, [crowns, hasHydrated, posts]);

  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const remotePosts = await fetchRemotePosts();
      setPosts(remotePosts as Post[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void refreshPosts().catch(() => {
      setIsLoading(false);
    });
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

  const addPost = useCallback((newPostData: Omit<Post, 'id' | 'date' | 'likes' | 'comments'>) => {
    const newPost: Post = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      ...newPostData,
      likes: [],
      comments: [],
    };

    setPosts((prev) => mergePostCollections([newPost], prev));
    void upsertRemotePost(newPost)
      .then((persistedPost) => {
        setPosts((prev) =>
          mergePostCollections([persistedPost as Post], prev.filter((post) => post.id !== newPost.id && post.id !== persistedPost.id))
        );
      })
      .catch(() => {
        showToast({
          tone: 'error',
          title: 'Post sync failed',
          message: 'Your post is only stored locally until the backend is reachable again.',
        });
      });

    if (newPostData.isBeerFinished) {
      setLastAwardedEventTitle(newPostData.eventTitle ?? 'your latest capture');
      setCrowns((prev) => prev + 1);
    }
  }, [showToast]);

  const togglePostLike = useCallback((postId: string) => {
    const previousPosts = posts;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: post.likes.includes(user.username)
                ? post.likes.filter((entry) => entry !== user.username)
                : [...post.likes, user.username],
            }
          : post
      )
    );

    void toggleRemotePostLike(postId)
      .then((persistedPost) => {
        setPosts((prev) =>
          mergePostCollections([persistedPost as Post], prev.filter((post) => post.id !== postId))
        );
      })
      .catch(() => {
        setPosts(previousPosts);
      });
  }, [posts, user.username]);

  const addPostComment = useCallback((postId: string, user: PostUser, text: string) => {
    if (!text.trim()) {
      return { ok: false, error: 'Write a comment before sending.' };
    }

    const newComment: PostComment = {
      id: `comment-${postId}-${Date.now()}`,
      user,
      text: text.trim(),
      time: 'Just now',
    };

    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [newComment, ...post.comments] } : post))
    );

    void addRemotePostComment(postId, text.trim())
      .then((persistedPost) => {
        setPosts((prev) =>
          mergePostCollections([persistedPost as Post], prev.filter((post) => post.id !== postId))
        );
      })
      .catch(() => {
        showToast({
          tone: 'error',
          title: 'Comment sync failed',
          message: 'The comment could not be saved to the backend.',
        });
      });

    return { ok: true };
  }, [showToast]);

  const deletePost = useCallback((postId: string) => {
    const previousPosts = posts;
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    void deleteRemotePost(postId).catch(() => {
      setPosts(previousPosts);
      showToast({
        tone: 'error',
        title: 'Delete failed',
        message: 'The backend rejected that delete request.',
      });
    });
  }, [posts, showToast]);

  const value = useMemo(
    () => ({ posts, crowns, isLoading, addPost, togglePostLike, addPostComment, deletePost, refreshPosts }),
    [posts, crowns, isLoading, addPost, togglePostLike, addPostComment, deletePost, refreshPosts]
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
