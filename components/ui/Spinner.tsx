import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../../constants/colors';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  fullscreen?: boolean;
}

export function Spinner({
  size = 'large',
  color,
  style,
  fullscreen = false,
}: SpinnerProps) {
  const colors = useThemeColors();
  const spinnerColor = color ?? colors.primary;

  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={size} color={spinnerColor} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={spinnerColor} style={style} />;
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
