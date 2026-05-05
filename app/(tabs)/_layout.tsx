import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Layout, Radius, Shadows, Spacing, TabRouteName, TabThemes, Typography } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

function TabButton({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 7,
            tension: 180,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 180,
          }).start()
        }>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedRoute = state.routes[state.index];

  if (focusedRoute?.name === 'camera') {
    return null;
  }

  const renderButton = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const routeName = route.name as TabRouteName;
    const routeTheme = TabThemes[routeName] ?? TabThemes.index;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const isCameraButton = routeName === 'camera';
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };

    return (
      <TabButton key={route.key} onPress={onPress} style={styles.item}>
        <View style={styles.itemContent}>
          <View
            style={[
              styles.activeMarker,
              isFocused && !isCameraButton
                ? { backgroundColor: routeTheme.accent, opacity: 1 }
                : styles.activeMarkerHidden,
            ]}
          />

          {isCameraButton ? (
            <LinearGradient
              colors={[routeTheme.accent, routeTheme.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cameraWrap, isFocused && styles.cameraWrapFocused]}>
              {options.tabBarIcon?.({ focused: isFocused, color: '#fff7ef', size: 24 })}
            </LinearGradient>
          ) : (
            <View style={styles.iconWrap}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? routeTheme.accent : '#b8ada4',
                size: 22,
              })}
            </View>
          )}

        </View>
      </TabButton>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom, Layout.tabBarInset) }]}>
      <View style={styles.bar}>
        <View style={styles.row}>
          {state.routes.filter((route) => route.name !== 'profile').map((route, index) => renderButton(route, index))}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={({ route }) => {
        const routeTheme = TabThemes[(route.name as TabRouteName) ?? 'index'] ?? TabThemes.index;

        return {
          sceneStyle: { backgroundColor: routeTheme.background },
          headerShown: false,
        };
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('feedTab'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('exploreTab'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'globe' : 'globe-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('captureTab'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'camera' : 'camera-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="socialfeed"
        options={{
          title: t('socialTab'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'logo-instagram' : 'logo-instagram'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: t('rewardsTab'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medal' : 'medal-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: t('profileTab'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    width: '92%',
    minHeight: 84,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Shadows.floating,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  itemContent: {
    alignItems: 'center',
    gap: 0,
    width: '100%',
  },
  activeMarker: {
    width: 18,
    height: 3,
    borderRadius: Radius.round,
  },
  activeMarkerHidden: {
    opacity: 0,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cameraWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    marginTop: -10,
  },
  cameraWrapFocused: {
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
