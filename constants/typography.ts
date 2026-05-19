import { TextStyle } from 'react-native';

// Install: npx expo install @expo-google-fonts/plus-jakarta-sans expo-font
// Load in app/_layout.tsx with useFonts()

export const FontFamily = {
  regular:     'PlusJakartaSans_400Regular',
  medium:      'PlusJakartaSans_500Medium',
  semiBold:    'PlusJakartaSans_600SemiBold',
  bold:        'PlusJakartaSans_700Bold',
  extraBold:   'PlusJakartaSans_800ExtraBold',
} as const;

export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FontFamily.extraBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;
