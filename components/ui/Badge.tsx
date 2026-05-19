import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.primarySurface, text: Colors.primary },
  success: { bg: '#CCFBF1', text: '#0F766E' },
  warning: { bg: '#FEF3C7', text: '#B45309' },
  danger:  { bg: '#FFE4E6', text: '#BE123C' },
  muted:   { bg: Colors.surfaceElevated, text: Colors.textMuted },
};

export function Badge({ label, variant = 'primary', style }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
