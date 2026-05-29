import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

function Section({ title, body }: { title: string; body: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: colors.textMuted }]}>{body}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const colors = useThemeColors();
  const t = useT();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.privacy')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.updated, { color: colors.textMuted }]}>{t('privacy.lastUpdated')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.content}>
          <Section title={t('privacy.s1Title')} body={t('privacy.s1Body')} />
          <Section title={t('privacy.s2Title')} body={t('privacy.s2Body')} />
          <Section title={t('privacy.s3Title')} body={t('privacy.s3Body')} />
          <Section title={t('privacy.s4Title')} body={t('privacy.s4Body')} />
          <Section title={t('privacy.s5Title')} body={t('privacy.s5Body')} />
          <Section title={t('privacy.s6Title')} body={t('privacy.s6Body')} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <Text style={[styles.contact, { color: colors.textMuted }]}>
            {t('privacy.contact')}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  updated: { fontSize: 12 },
  content: { gap: 20 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  contact: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
