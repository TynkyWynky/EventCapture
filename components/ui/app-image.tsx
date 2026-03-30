import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image, ImageProps } from 'expo-image';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface AppImageProps extends Omit<ImageProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

export function AppImage({ style, ...props }: AppImageProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {!hasError ? (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fade }]}>
          <Image
            {...props}
            style={StyleSheet.absoluteFillObject}
            onLoadStart={() => {
              setIsLoading(true);
              setHasError(false);
              fade.setValue(0);
            }}
            onLoad={() => {
              setIsLoading(false);
              Animated.timing(fade, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
              }).start();
            }}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </Animated.View>
      ) : null}

      {isLoading && !hasError ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.light.tint} />
        </View>
      ) : null}

      {hasError ? (
        <View style={styles.fallback}>
          <Ionicons name="image-outline" size={24} color="#9a8f87" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#eadfd4',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efe3d5',
  },
});
