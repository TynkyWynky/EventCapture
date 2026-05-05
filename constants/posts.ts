export interface PostUser {
  id: string;
  username: string;
  avatarUri: string;
}

export interface PostComment {
  id: string;
  user: PostUser;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  user: PostUser;
  imageUri: string;
  date: string;
  isBeerFinished: boolean;
  eventId?: string;
  eventTitle?: string;
  likes: string[];
  comments: PostComment[];
  captureId?: string;
}
