import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Post {
  id: string;
  imageUri: string;
  date: string;
  isBeerFinished: boolean;
  eventTitle?: string;
}

interface PostContextType {
  posts: Post[];
  crowns: number;
  addPost: (post: Omit<Post, 'id' | 'date'>) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export function PostProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [crowns, setCrowns] = useState(3); // Start with 3 for demo

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

  return (
    <PostContext.Provider value={{ posts, crowns, addPost }}>
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
