import { useColorScheme } from 'react-native';

export const LightColors = {
  primary:         '#3730AB',
  primaryLight:    '#5B52DF',
  primarySurface:  '#EEEEFF',
  accent:          '#F0B429',
  background:      '#F7F7FF',
  surface:         '#FFFFFF',
  surfaceElevated: '#EEEEFF',
  text:            '#1E1B8B',
  textMuted:       '#7C6FA0',
  success:         '#00C9A7',
  warning:         '#F0B429',
  danger:          '#FF4757',
  border:          '#E0D9FF',
  divider:         '#EDE9FF',
  white:           '#FFFFFF',
  black:           '#000000',
  planFree:        '#7C6FA0',
  planPremium:     '#3B2FCC',
  planFamily:      '#00C9A7',
  categoryLegal:   '#FF4757',
  categoryHealth:  '#00C9A7',
  categoryFinance: '#F0B429',
  categoryPersonal:'#3B2FCC',
  categoryOther:   '#7C6FA0',
  priorityLow:     '#00C9A7',
  priorityMedium:  '#F0B429',
  priorityHigh:    '#FF4757',
} as const;

export const DarkColors = {
  primary:         '#5B52DF',
  primaryLight:    '#7B74EF',
  primarySurface:  '#1A1A3E',
  accent:          '#F0B429',
  background:      '#0D0D18',
  surface:         '#161625',
  surfaceElevated: '#1E1E35',
  text:            '#E8E6FF',
  textMuted:       '#8B7FB5',
  success:         '#00C9A7',
  warning:         '#F0B429',
  danger:          '#FF4757',
  border:          '#252545',
  divider:         '#1E1E35',
  white:           '#FFFFFF',
  black:           '#000000',
  planFree:        '#8B7FB5',
  planPremium:     '#5B52DF',
  planFamily:      '#00C9A7',
  categoryLegal:   '#FF4757',
  categoryHealth:  '#00C9A7',
  categoryFinance: '#F0B429',
  categoryPersonal:'#5B52DF',
  categoryOther:   '#8B7FB5',
  priorityLow:     '#00C9A7',
  priorityMedium:  '#F0B429',
  priorityHigh:    '#FF4757',
} as const;

export const Colors = LightColors;
export type ColorKey = keyof typeof LightColors;

export type ThemeColors = {
  readonly [K in keyof typeof LightColors]: string;
};

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}
