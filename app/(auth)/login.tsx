import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { login, loginWithGoogle } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const googleScale = useSharedValue(1);
  const googleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleScale.value }],
  }));

  const handleLogin = async () => {
    if (!email || !password) { setError(t('login.fillFields')); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('login.wrongCredentials'));
    } finally {
      setLoading(false);
    }
  };

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo + header */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(0).easing(Easing.out(Easing.quad))}
          style={styles.header}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.wordmark}
            resizeMode="contain"
            accessibilityLabel="LifeVault"
          />
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('login.subtitle')}</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(150).easing(Easing.out(Easing.quad))}
          style={styles.form}
        >
          <Input
            label={t('login.email')}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Input
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <Button
            label={t('login.enter')}
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.button}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>o</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

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

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300).easing(Easing.out(Easing.quad))}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.textMuted }]}>{t('login.noAccount')} </Text>
          <Link href="/(auth)/register" style={[styles.footerLink, { color: colors.primary }]}>
            {t('login.register')}
          </Link>
        </Animated.View>
      </KeyboardAvoidingView>
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
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    width: 220,
    height: 110,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
  button: {
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 14,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
