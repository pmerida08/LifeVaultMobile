import React, { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useI18nStore } from '../store/i18n.store';
import { useResolvedTheme } from '../constants/colors';
import { Spinner } from '../components/ui/Spinner';
import { ToastProvider } from '../lib/toast';
import '../global.css';

// Cap global del escalado de fuente a 1.3× para que el ajuste de "fuente grande"
// del sistema no rompa los layouts. En React 19 defaultProps ya no se aplica a
// componentes función (Text/TextInput son forwardRef), así que interceptamos su
// render para inyectar maxFontSizeMultiplier por defecto sin pisar overrides locales.
const MAX_FONT_SCALE = 1.3;

function capFontScaling(Component: typeof Text | typeof TextInput) {
  const target = Component as unknown as {
    render?: (...args: unknown[]) => React.ReactElement<{ maxFontSizeMultiplier?: number }>;
  };
  const originalRender = target.render;
  if (!originalRender) return;
  target.render = function (this: unknown, ...args: unknown[]) {
    const element = originalRender.apply(this, args);
    return React.cloneElement(element, {
      maxFontSizeMultiplier: element.props.maxFontSizeMultiplier ?? MAX_FONT_SCALE,
    });
  };
}

capFontScaling(Text);
capFontScaling(TextInput);

export default function RootLayout() {
  const { user, loading, initialize } = useAuthStore();
  const { initialize: initTheme } = useThemeStore();
  const { initialize: initI18n } = useI18nStore();
  const segments = useSegments();
  const resolved = useResolvedTheme();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    initialize();
    initTheme();
    initI18n();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    if (user && !inTabsGroup) {
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  if (loading || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <Spinner fullscreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
