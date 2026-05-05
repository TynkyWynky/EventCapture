import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveCrownReward, getCrownLevelProgress } from '@/constants/crowns';
import { isRemovedSeedEventId } from '@/constants/events';
import {
  addRemotePostComment,
  deleteRemotePost,
  fetchRemotePosts,
  toggleRemotePostLike,
  upsertRemotePost,
} from '@/services/appDataApi';
import { POST_RECORDS, Post, PostComment, PostUser } from '@/constants/posts';
import { useToast } from '@/context/ToastContext';
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext, ReactNode } from 'react';

interface PostContextType {
  posts: Post[];
  crowns: number;
  addPost: (post: Omit<Post, 'id' | 'date' | 'likes' | 'comments'>) => void;
  togglePostLike: (postId: string, username: string) => void;
  addPostComment: (postId: string, user: PostUser, text: string) => { ok: boolean; error?: string };
  deletePost: (postId: string) => void;
}

interface StoredPostState {
  posts: Post[];
  crowns: number;
}

const PostContext = createContext<PostContextType | undefined>(undefined);
const STORAGE_KEY = 'eventcapture.post-state';
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
    typeof post.user === 'object' &&
    Array.isArray(post.likes) &&
    Array.isArray(post.comments) &&
    (post.captureId === undefined || typeof post.captureId === 'string') &&
    (post.eventId === undefined || typeof post.eventId === 'string') &&
    (post.eventTitle === undefined || typeof post.eventTitle === 'string')
  );
}

function sanitizePost(post: Post): Post {
  if (!isRemovedSeedEventId(post.eventId)) {
    return post;
  }

  return {
    ...post,
    eventId: undefined,
    eventTitle: undefined,
  };
}

function parseStoredState(rawValue: string | null): StoredPostState | null {
  if (!rawValue) {
    return null;
  }

  const parsedValue = JSON.parse(rawValue) as Partial<StoredPostState>;
  const parsedPosts = Array.isArray(parsedValue.posts)
    ? parsedValue.posts.filter(isValidPost).map(sanitizePost)
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
  const [posts, setPosts] = useState<Post[]>(POST_RECORDS);
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

        setPosts(mergePostCollections(parsedState.posts, POST_RECORDS));
        setCrowns(parsedState.crowns);
      } catch {
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
    if (!hasHydrated) {
      return;
    }

    let isMounted = true;

    fetchRemotePosts()
      .then((remotePosts) => {
        if (!isMounted || !remotePosts.length) {
          return;
        }

        setPosts((prev) => mergePostCollections(remotePosts as Post[], prev, POST_RECORDS));
      })
      .catch(() => {
        // Keep local feed data when the backend is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, [hasHydrated]);

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

  const addPost = useCallback((newPostData: Omit<Post, 'id' | 'date' | 'likes' | 'comments'>) => {
    const newPost: Post = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      ...newPostData,
      likes: [],
      comments: [],
    };

    setPosts((prev) => mergePostCollections([newPost], prev));
    void upsertRemotePost(newPost)
      .then((persistedPost) => {
        setPosts((prev) =>
          mergePostCollections(
            [persistedPost as Post],
            prev.filter((post) => post.id !== persistedPost.id),
            POST_RECORDS
          )
        );
      })
      .catch(() => {
        // The local feed stays usable even if remote sync fails.
      });

    if (newPostData.isBeerFinished) {
      setLastAwardedEventTitle(newPostData.eventTitle ?? 'your latest capture');
      setCrowns((prev) => prev + 1);
    }
  }, []);

  const togglePostLike = useCallback((postId: string, username: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const index = post.likes.indexOf(username);
        let newLikes = [...post.likes];
        if (index > -1) {
          newLikes.splice(index, 1);
        } else {
          newLikes.push(username);
        }
        return { ...post, likes: newLikes };
      })
    );
    void toggleRemotePostLike(postId, username)
      .then((persistedPost) => {
        setPosts((prev) =>
          mergePostCollections(
            [persistedPost as Post],
            prev.filter((post) => post.id !== postId),
            POST_RECORDS
          )
        );
      })
      .catch(() => {
        // Optimistic local update is retained when sync is unavailable.
      });
  }, []);

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
      prev.map((post) => {
        if (post.id !== postId) return post;
        return { ...post, comments: [newComment, ...post.comments] };
      })
    );
    void addRemotePostComment(postId, user, text.trim())
      .then((persistedPost) => {
        setPosts((prev) =>
          mergePostCollections(
            [persistedPost as Post],
            prev.filter((post) => post.id !== postId),
            POST_RECORDS
          )
        );
      })
      .catch(() => {
        // Local comments stay visible if the backend cannot be reached.
      });

    return { ok: true };
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    void deleteRemotePost(postId).catch(() => {
      // Keep the local delete applied if the remote cleanup fails.
    });
  }, []);

  const value = useMemo(
    () => ({ posts, crowns, addPost, togglePostLike, addPostComment, deletePost }),
    [posts, crowns, addPost, togglePostLike, addPostComment, deletePost]
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
