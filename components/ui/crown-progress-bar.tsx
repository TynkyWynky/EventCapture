import { Colors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface CrownProgressBarProps {
  progress: number;
  tone?: 'light' | 'dark';
  height?: number;
}

export function CrownProgressBar({
  progress,
  tone = 'light',
  height = 10,
}: CrownProgressBarProps) {
  const safeProgress = Math.max(0, Math.min(progress, 100));
  const animatedProgress = useRef(new Animated.Value(safeProgress)).current;
  const shimmer = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: safeProgress,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, safeProgress]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmer]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        tone === 'dark' ? styles.trackDark : styles.trackLight,
        { height, borderRadius: height / 2 },
      ]}>
      <Animated.View
        style={[
          styles.fill,
          tone === 'dark' ? styles.fillDark : styles.fillLight,
          {
            width,
            borderRadius: height / 2,
          },
        ]}>
        <Animated.View
          style={[
            styles.glow,
            tone === 'dark' ? styles.glowDark : styles.glowLight,
            {
              width: height + 10,
              height: height + 10,
              borderRadius: (height + 10) / 2,
              opacity: shimmer,
              transform: [{ scale: shimmer }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  trackLight: {
    backgroundColor: '#efe3d5',
  },
  trackDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fill: {
    height: '100%',
    justifyContent: 'center',
    overflow: 'visible',
  },
  fillLight: {
    backgroundColor: Colors.light.tint,
  },
  fillDark: {
    backgroundColor: '#ffd29d',
  },
  glow: {
    position: 'absolute',
    right: -4,
  },
  glowLight: {
    backgroundColor: 'rgba(255, 211, 157, 0.55)',
  },
  glowDark: {
    backgroundColor: 'rgba(255, 218, 179, 0.58)',
  },
});
