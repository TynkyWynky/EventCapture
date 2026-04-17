import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function TabButton({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
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
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const focusedRoute = state.routes[state.index];
  const { unreadCount } = useSocial();

  if (focusedRoute?.name === 'camera') {
    return null;
  }

  const leftRoutes = state.routes.slice(0, 2);
  const centerRoutes = state.routes.slice(2, 4);
  const rightRoutes = state.routes.slice(4, 6);

  const renderNormalButton = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };

    return (
      <TabButton key={route.key} onPress={onPress} style={[styles.item, isFocused && styles.itemFocused]}>
        <View style={[styles.inner, isFocused && styles.innerFocused]}>
          {options.tabBarIcon?.({ focused: isFocused, color: isFocused ? '#1f1a17' : palette.muted, size: 22 })}
          {route.name === 'profile' && unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </TabButton>
    );
  };

  const renderCenterButton = (route: any, index: number, isFirst: boolean) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };

    return (
      <View key={route.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Divider if it's the second center button */}
        {!isFirst && <View style={styles.centerDivider} />}
        <TabButton onPress={onPress}>
          <View style={[styles.centerItemInner, isFocused && styles.centerItemFocused]}>
            {options.tabBarIcon?.({ 
              focused: isFocused, 
              color: isFocused ? '#ffffff' : 'rgba(255,255,255,0.5)', 
              size: route.name === 'camera' ? 24 : 22 
            })}
          </View>
        </TabButton>
      </View>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom, 14) }]}>
      <View style={[styles.bar, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <View style={styles.barGlow} />

        <View style={styles.sideGroup}>
          {leftRoutes.map((route) => {
            const index = state.routes.indexOf(route);
            return renderNormalButton(route, index);
          })}
        </View>

        <LinearGradient colors={[Colors.light.tint, Colors.light.tintDark]} style={styles.centerGroup}>
          {centerRoutes.map((route, i) => {
            const index = state.routes.indexOf(route);
            return renderCenterButton(route, index, i === 0);
          })}
        </LinearGradient>

        <View style={styles.sideGroup}>
          {rightRoutes.map((route) => {
            const index = state.routes.indexOf(route);
            return renderNormalButton(route, index);
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: palette.background },
        headerShown: false,
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
    minHeight: 82,
    borderRadius: 36,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    overflow: 'hidden',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 14,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: '#fff7ef',
  },
  sideGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  itemFocused: {
  },
  inner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFocused: {
    backgroundColor: '#f7f1ea',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e45b5b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    padding: 6,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  centerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 2,
  },
  centerItemInner: {
    minWidth: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerItemFocused: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
