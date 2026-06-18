import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { Colors, useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { loginWithGoogle } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const googleScale = useSharedValue(1);
  const googleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleScale.value }],
  }));

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.googleError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Logo + header */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(0).easing(Easing.out(Easing.quad))}
          style={styles.header}
        >
          <Image
            source={require('../../assets/logo-icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
            accessibilityLabel="LifeVault"
          />
          <Text style={[styles.appName, { color: colors.primary }]}>LifeVault</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('login.subtitle')}</Text>
        </Animated.View>

        {/* Google sign-in */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(150).easing(Easing.out(Easing.quad))}
          style={styles.form}
        >
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <AnimatedPressable
            onPress={handleGoogle}
            onPressIn={() => {
              googleScale.value = withTiming(0.97, { duration: 100, easing: Easing.out(Easing.quad) });
            }}
            onPressOut={() => {
              googleScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
            }}
            disabled={googleLoading}
            accessibilityRole="button"
            accessibilityLabel={t('login.continueWithGoogle')}
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }, googleAnimStyle]}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.googleText, { color: colors.text }]}>
              {googleLoading ? t('login.connecting') : t('login.continueWithGoogle')}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 40,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 130,
    height: 130,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
