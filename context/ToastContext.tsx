import { Toast, ToastItem } from '@/components/ui/toast';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ShowToastInput {
  title: string;
  message?: string;
  tone?: ToastItem['tone'];
}

interface ToastContextType {
  showToast: (input: ShowToastInput) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastPortal({ toast, opacity, translateY }: { toast: ToastItem | null; opacity: Animated.Value; translateY: Animated.Value }) {
  const insets = useSafeAreaInsets();

  if (!toast) {
    return null;
  }

  return (
    <View style={[styles.portal, { top: Math.max(insets.top, 18) + 6, pointerEvents: 'none' }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Toast item={toast} />
      </Animated.View>
    </View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (!toast) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver }),
        Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver }),
      ]).start(() => setToast(null));
    }, 2400);

    return () => clearTimeout(timer);
  }, [opacity, toast, translateY]);

  const value = useMemo<ToastContextType>(
    () => ({
      showToast: ({ title, message, tone = 'info' }) => {
        opacity.setValue(0);
        translateY.setValue(-12);
        setToast({
          id: `${Date.now()}`,
          title,
          message,
          tone,
        });
      },
    }),
    [opacity, translateY]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastPortal toast={toast} opacity={opacity} translateY={translateY} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  portal: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
});
