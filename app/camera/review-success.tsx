import { usePosts } from '@/context/PostContext';
import { useSocial } from '@/context/SocialContext';
import { useUser } from '@/context/UserContext';
import { CaptureReviewScreen } from '@/components/capture-review-screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function ReviewSuccessScreen() {
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
        isBeerFinished: true,
        eventId,
        eventTitle,
      });
      addActivity({
        user: user.username,
        text: `posted a crown-eligible capture from ${eventTitle}`,
        icon: 'ribbon',
        color: Colors.light.tint,
      });
      router.push('/(tabs)');
    }
  };

  return <CaptureReviewScreen photoUri={photoUri} isBeerFinished onPost={handlePost} />;
}
