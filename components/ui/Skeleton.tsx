import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../../constants/colors';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius, backgroundColor: colors.border },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const colors = useThemeColors();
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 10 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton height={14} width="70%" />
          <Skeleton height={12} width="45%" />
        </View>
      </View>
    </View>
  );
}

export function SkeletonDashboard() {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 16, padding: 16 }}>
      <View style={{ gap: 6 }}>
        <Skeleton height={24} width="60%" />
        <Skeleton height={14} width="40%" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8 }}
          >
            <Skeleton width={40} height={40} borderRadius={12} />
            <Skeleton height={20} width={36} />
            <Skeleton height={12} width={60} />
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton height={17} width="40%" />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
      <View style={{ gap: 8 }}>
        <Skeleton height={17} width="40%" />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    </View>
  );
}

export function SkeletonVault() {
  return (
    <View style={{ padding: 16, gap: 10, paddingTop: 8 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonPlanner() {
  const colors = useThemeColors();
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Skeleton height={19} width="30%" />
      <View style={{ gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Skeleton width={22} height={22} borderRadius={11} />
              <View style={{ flex: 1, gap: 5 }}>
                <Skeleton height={15} width="75%" />
                <Skeleton height={12} width="40%" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
