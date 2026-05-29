import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

const FAQ_KEYS = [
  { q: 'helpFaq.q1', a: 'helpFaq.a1' },
  { q: 'helpFaq.q2', a: 'helpFaq.a2' },
  { q: 'helpFaq.q3', a: 'helpFaq.a3' },
  { q: 'helpFaq.q4', a: 'helpFaq.a4' },
  { q: 'helpFaq.q5', a: 'helpFaq.a5' },
  { q: 'helpFaq.q6', a: 'helpFaq.a6' },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const colors = useThemeColors();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.question}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <View style={[styles.answer, { borderTopColor: colors.border }]}>
          <Text style={[styles.answerText, { color: colors.textMuted }]}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpFaqScreen() {
  const colors = useThemeColors();
  const t = useT();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.helpFaq')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('helpFaq.subtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.list}>
          {FAQ_KEYS.map((item, i) => (
            <FaqItem
              key={i}
              question={t(item.q)}
              answer={t(item.a)}
            />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Text style={[styles.contact, { color: colors.textMuted }]}>{t('helpFaq.contact')}</Text>
          <Text style={[styles.email, { color: colors.primary }]}>{t('helpFaq.email')}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  list: { gap: 10 },
  item: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  question: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  answer: { padding: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  answerText: { fontSize: 14, lineHeight: 22 },
  contact: { textAlign: 'center', fontSize: 13 },
  email: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 4 },
});
