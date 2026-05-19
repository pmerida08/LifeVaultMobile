export const Colors = {
  // Brand — Vault Indigo (extraído del logo)
  primary:        '#3730AB',  // cara oscura del escudo
  primaryLight:   '#5B52DF',  // cara clara del escudo
  primarySurface: '#EEEEFF',  // superficie tintada

  // Accent
  accent:         '#F0B429',

  // Surfaces
  background:     '#F7F7FF',
  surface:        '#FFFFFF',
  surfaceElevated:'#EEEEFF',

  // Text
  text:           '#1E1B8B',  // color del wordmark del logo
  textMuted:      '#7C6FA0',

  // Semantic
  success:        '#00C9A7',
  warning:        '#F0B429',
  danger:         '#FF4757',

  // Structure
  border:         '#E0D9FF',
  divider:        '#EDE9FF',

  // Fixed
  white:          '#FFFFFF',
  black:          '#000000',

  // Plan tokens
  planFree:       '#7C6FA0',
  planPremium:    '#3B2FCC',
  planFamily:     '#00C9A7',

  // Category tokens
  categoryLegal:   '#FF4757',
  categoryHealth:  '#00C9A7',
  categoryFinance: '#F0B429',
  categoryPersonal:'#3B2FCC',
  categoryOther:   '#7C6FA0',

  // Priority tokens
  priorityLow:    '#00C9A7',
  priorityMedium: '#F0B429',
  priorityHigh:   '#FF4757',
} as const;

export type ColorKey = keyof typeof Colors;
