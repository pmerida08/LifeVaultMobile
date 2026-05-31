import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = focused
      ? withSpring(1.18, { damping: 8, stiffness: 200 })
      : withSpring(1, { damping: 10, stiffness: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as IoniconName)}
        size={24}
        color={focused ? colors.primary : colors.textMuted}
        accessibilityElementsHidden
      />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const colors = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();

  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopColor: colors.border,
          elevation: 16,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.10,
          shadowRadius: 16,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: t('tabs.vault'),
          tabBarIcon: ({ focused }) => <TabIcon name="folder" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: t('tabs.assistant'),
          tabBarIcon: ({ focused }) => <TabIcon name="sparkles" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: t('tabs.planner'),
          tabBarIcon: ({ focused }) => <TabIcon name="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
