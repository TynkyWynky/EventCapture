import { usePosts } from '@/context/PostContext';
import { useSocial } from '@/context/SocialContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';
import { CaptureReviewScreen } from '@/components/capture-review-screen';
import { Colors } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function ReviewSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const { addPost } = usePosts();
  const { addActivity } = useSocial();
  const { showToast } = useToast();
  const { user } = useUser();
  const { t } = useLanguage();

  const handlePost = (eventId: string, eventTitle: string) => {
    if (photoUri) {
      addPost({
        user: {
          id: user.username,
          username: user.username,
          avatarUri: user.avatarUri,
        },
        imageUri: photoUri,
        isBeerFinished: true,
        eventId,
        eventTitle,
      });
      addActivity({
        user: user.username,
        text: `${t('activityPostedCrown')} ${eventTitle}`,
        icon: 'ribbon',
        color: Colors.light.tint,
      });
      showToast({
        tone: 'success',
        title: t('toastCrownTitle'),
        message: `${t('toastCrownMsg')} ${eventTitle} ${t('toastCrownMsgEnd')}`,
      });
      router.replace('/(tabs)');
    }
  };

  return <CaptureReviewScreen photoUri={photoUri} isBeerFinished onPost={handlePost} />;
}
