import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { Card } from '../../../components/ui/Card';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

const APP_VERSION = '1.0.0';

const TECH_STACK = [
  { name: 'Expo SDK 54', icon: 'phone-portrait-outline' },
  { name: 'React Native', icon: 'logo-react' },
  { name: 'Supabase', icon: 'server-outline' },
  { name: 'Zustand', icon: 'layers-outline' },
  { name: 'NativeWind', icon: 'color-palette-outline' },
];

export default function AboutScreen() {
  const colors = useThemeColors();
  const t = useT();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.about')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* App identity */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.identity}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.white} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>LifeVault Mobile</Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            {t('about.version')} {APP_VERSION}
          </Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>{t('about.tagline')}</Text>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Card>
            <Text style={[styles.description, { color: colors.text }]}>{t('about.description')}</Text>
          </Card>
        </Animated.View>

        {/* Tech stack */}
        <Animated.View entering={FadeInDown.duration(400).delay(140)}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('about.builtWith')}</Text>
          <Card style={styles.techCard}>
            {TECH_STACK.map((tech, i) => (
              <React.Fragment key={tech.name}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.techRow}>
                  <View style={[styles.techIcon, { backgroundColor: colors.primarySurface }]}>
                    <Ionicons name={tech.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.techName, { color: colors.text }]}>{tech.name}</Text>
                </View>
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>

        {/* Credits */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.credits, { color: colors.textMuted }]}>
            {t('about.credits')}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  identity: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  appIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  version: { fontSize: 13 },
  tagline: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  description: { fontSize: 14, lineHeight: 22 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, paddingLeft: 4, marginBottom: -4 },
  techCard: { gap: 0, padding: 0, overflow: 'hidden' },
  techRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  techIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  techName: { fontSize: 15, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  credits: { textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
