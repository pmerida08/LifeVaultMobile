import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { useThemeColors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: elevated ? colors.surfaceElevated : colors.surface },
        elevated && styles.elevatedShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#1A1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevatedShadow: {
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});
