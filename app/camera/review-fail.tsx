import { usePosts } from '@/context/PostContext';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { CaptureReviewScreen } from '@/components/capture-review-screen';
import { Colors } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function ReviewFailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const { addPost } = usePosts();
  const { addActivity } = useSocial();
  const { showToast } = useToast();
  const { user } = useUser();

  const handlePost = (eventId: string, eventTitle: string) => {
    if (photoUri) {
      addPost({
        user: {
          id: user.username, // In a real app this would be a proper ID
          username: user.username,
          avatarUri: user.avatarUri,
        },
        imageUri: photoUri,
        isBeerFinished: false,
        eventId,
        eventTitle,
      });
      addActivity({
        user: user.username,
        text: `shared a capture from ${eventTitle}`,
        icon: 'image-outline',
        color: Colors.light.tint,
      });
      showToast({
        tone: 'info',
        title: 'Capture shared',
        message: `Your moment from ${eventTitle} was posted to the feed.`,
      });
      router.replace('/(tabs)');
    }
  };

  return <CaptureReviewScreen photoUri={photoUri} isBeerFinished={false} onPost={handlePost} />;
}
