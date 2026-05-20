import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const CONFIG: Record<ToastType, { bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  success: { bg: '#00C9A7', icon: 'checkmark-circle' },
  error:   { bg: '#FF4757', icon: 'alert-circle' },
  info:    { bg: '#3730AB', icon: 'information-circle' },
};

function ToastBubble({ toast }: { toast: ToastItem }) {
  const cfg = CONFIG[toast.type];
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16).stiffness(220)}
      exiting={FadeOutUp.duration(180)}
      style={[styles.toast, { backgroundColor: cfg.bg }]}
    >
      <Ionicons name={cfg.icon} size={20} color="#fff" accessibilityElementsHidden />
      <Text style={styles.text} numberOfLines={3}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastOverlay({ toasts }: { toasts: ToastItem[] }) {
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;
  return (
    <View
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="none"
    >
      {toasts.map((t) => (
        <ToastBubble key={t.id} toast={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
});
