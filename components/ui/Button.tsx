import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  accessibilityLabel?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.primary },
    text: { color: Colors.white },
  },
  secondary: {
    container: {
      backgroundColor: Colors.surfaceElevated,
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    text: { color: Colors.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.primary },
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: Colors.white },
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, minHeight: 44 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, minHeight: 44 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, minHeight: 52 },
    text: { fontSize: 17 },
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  label,
  accessibilityLabel,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100, easing: Easing.out(Easing.quad) });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
  }, []);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.text.color as string} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={16} color={vStyle.text.color as string} />}
          <Text style={[styles.text, vStyle.text, sStyle.text]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.45,
  },
});
