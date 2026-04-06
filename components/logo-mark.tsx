import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function LogoMark({ size = 64, style }: Props) {
  return (
    <Image
      source={require('@/assets/images/splash-icon.png')}
      style={[{ width: size, height: size, borderRadius: size * 0.1 }, style]}
      contentFit="contain"
    />
  );
}
