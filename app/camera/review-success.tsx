import { usePosts } from '@/context/PostContext';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { CaptureReviewScreen } from '@/components/capture-review-screen';
import { Colors } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function ReviewSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const storedImageUri = params.storedImageUri as string | undefined;
  const captureId = params.captureId as string | undefined;
  const analysisHeadline = params.analysisHeadline as string | undefined;
  const analysisMessage = params.analysisMessage as string | undefined;
  const detectedDrinks = typeof params.detectedDrinks === 'string' && params.detectedDrinks.length
    ? params.detectedDrinks.split('|').filter(Boolean)
    : [];
  const topDrink = params.topDrink as string | undefined;
  const { addPost } = usePosts();
  const { addActivity } = useSocial();
  const { showToast } = useToast();
  const { user } = useUser();

  const handlePost = (eventId: string, eventTitle: string) => {
    if (photoUri) {
      addPost({
        user: {
          id: user.username,
          username: user.username,
          avatarUri: user.avatarUri,
        },
        imageUri: storedImageUri || photoUri,
        isBeerFinished: true,
        eventId,
        eventTitle,
        captureId: captureId || undefined,
      });
      addActivity({
        user: user.username,
        text: `posted a crown-eligible capture from ${eventTitle}`,
        icon: 'ribbon',
        color: Colors.light.tint,
      });
      showToast({
        tone: 'success',
        title: 'Capture posted',
        message: `Your crown-eligible moment from ${eventTitle} is now live.`,
      });
      router.replace('/(tabs)');
    }
  };

  return (
    <CaptureReviewScreen
      photoUri={photoUri}
      isBeerFinished
      onPost={handlePost}
      analysisHeadline={analysisHeadline}
      analysisMessage={analysisMessage}
      detectedDrinks={detectedDrinks}
      topDrink={topDrink}
    />
  );
}
