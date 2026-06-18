import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';

type Category = 'legal' | 'health' | 'finance' | 'personal' | 'other';

const CATEGORY_I18N: Record<Category, string> = {
  legal: 'vault.catLegal',
  health: 'vault.catHealth',
  finance: 'vault.catFinance',
  personal: 'vault.catPersonal',
  other: 'vault.catOther',
};

interface CategoryBadgeProps {
  category?: string | null;
  style?: ViewStyle;
}

/**
 * Pill de categoría: se traduce con el idioma activo y toma el color
 * de la categoría del tema (claro/oscuro).
 */
export function CategoryBadge({ category, style }: CategoryBadgeProps) {
  const colors = useThemeColors();
  const t = useT();
  const cat = (category ?? 'other') as Category;

  const colorMap: Record<Category, string> = {
    legal: colors.categoryLegal,
    health: colors.categoryHealth,
    finance: colors.categoryFinance,
    personal: colors.categoryPersonal,
    other: colors.categoryOther,
  };
  const color = colorMap[cat] ?? colors.textMuted;
  const label = t(CATEGORY_I18N[cat] ?? 'vault.catOther');

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
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
