import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors, useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';

export default function RegisterScreen() {
  const t = useT();
  const colors = useThemeColors();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError(t('register.fillFields'));
      return;
    }
    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('register.createError'));
    } finally {
      setLoading(false);
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
            source={require('../../assets/logo-icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
            accessibilityLabel="LifeVault"
          />
          <Text style={[styles.appName, { color: colors.primary }]}>LifeVault</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('register.title')}</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(150).easing(Easing.out(Easing.quad))}
          style={styles.form}
        >
          <Input
            label={t('register.name')}
            value={name}
            onChangeText={setName}
            placeholder="Pablo"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
          <Input
            label={t('register.email')}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Input
            label={t('register.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          <Button
            label={t('register.createAccount')}
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.button}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(300).easing(Easing.out(Easing.quad))}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.textMuted }]}>{t('register.hasAccount')} </Text>
          <Link href="/(auth)/login" style={[styles.footerLink, { color: colors.primary }]}>
            {t('register.signIn')}
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
