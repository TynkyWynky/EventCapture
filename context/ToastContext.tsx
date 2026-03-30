import { Toast, ToastItem } from '@/components/ui/toast';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface ShowToastInput {
  title: string;
  message?: string;
  tone?: ToastItem['tone'];
}

interface ToastContextType {
  showToast: (input: ShowToastInput) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (!toast) {
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
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
      {toast ? (
        <View pointerEvents="none" style={styles.portal}>
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <Toast item={toast} />
          </Animated.View>
        </View>
      ) : null}
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
    top: 18,
    left: 16,
    right: 16,
    zIndex: 100,
  },
});
