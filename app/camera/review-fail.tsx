import { usePosts } from '@/context/PostContext';
import { useSocial } from '@/context/SocialContext';
import { useUser } from '@/context/UserContext';
import { CaptureReviewScreen } from '@/components/capture-review-screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function ReviewFailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const { addPost } = usePosts();
  const { addActivity } = useSocial();
  const { user } = useUser();

  const handlePost = (eventId: string, eventTitle: string) => {
    if (photoUri) {
      addPost({
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
      router.push('/(tabs)');
    }
  };

  return <CaptureReviewScreen photoUri={photoUri} isBeerFinished={false} onPost={handlePost} />;
}
