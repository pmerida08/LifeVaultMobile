import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../../store/auth.store';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

const FREE_FEATURES = [
  'subscription.freeVault',
  'subscription.freeAssistant',
  'subscription.freePlanner',
];

const PREMIUM_FEATURES = [
  'subscription.premiumUnlimited',
  'subscription.premiumSearch',
  'subscription.premiumPriority',
  'subscription.premiumBackup',
];

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={styles.featureRow}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle-outline'}
        size={18}
        color={included ? colors.success : colors.textMuted}
      />
      <Text style={[styles.featureText, { color: included ? colors.text : colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function SubscriptionScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { user } = useAuthStore();
  const isPremium = user?.plan === 'premium' || user?.plan === 'family';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.subscription')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current plan */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card elevated style={styles.currentPlan}>
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planLabel, { color: colors.textMuted }]}>{t('subscription.currentPlan')}</Text>
                <Text style={[styles.planName, { color: colors.text }]}>
                  {user?.plan === 'free' ? t('subscription.free') :
                   user?.plan === 'premium' ? t('subscription.premium') :
                   t('subscription.family')}
                </Text>
              </View>
              <Badge
                label={user?.plan ?? 'free'}
                variant={user?.plan === 'free' ? 'muted' : 'primary'}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Free plan */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Card style={[styles.planCard, !isPremium ? { borderWidth: 2, borderColor: colors.primary } : undefined]}>
            <View style={styles.planTitleRow}>
              <Text style={[styles.planCardTitle, { color: colors.text }]}>{t('subscription.free')}</Text>
              <Text style={[styles.planPrice, { color: colors.textMuted }]}>{t('subscription.freePrice')}</Text>
            </View>
            {FREE_FEATURES.map((key) => (
              <FeatureRow key={key} label={t(key)} included={true} />
            ))}
            {PREMIUM_FEATURES.map((key) => (
              <FeatureRow key={key} label={t(key)} included={false} />
            ))}
          </Card>
        </Animated.View>

        {/* Premium plan */}
        <Animated.View entering={FadeInDown.duration(400).delay(140)}>
          <Card style={[styles.planCard, isPremium ? { borderWidth: 2, borderColor: colors.primary } : undefined]}>
            <View style={styles.planTitleRow}>
              <View style={styles.planTitleGroup}>
                <Text style={[styles.planCardTitle, { color: colors.text }]}>{t('subscription.premium')}</Text>
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.popularText, { color: colors.white }]}>{t('subscription.popular')}</Text>
                </View>
              </View>
              <Text style={[styles.planPrice, { color: colors.primary }]}>{t('subscription.premiumPrice')}</Text>
            </View>
            {FREE_FEATURES.concat(PREMIUM_FEATURES).map((key) => (
              <FeatureRow key={key} label={t(key)} included={true} />
            ))}
          </Card>
        </Animated.View>

        {!isPremium && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Button
              label={t('subscription.upgrade')}
              onPress={() => {}}
              icon="sparkles-outline"
            />
            <Text style={[styles.comingSoon, { color: colors.textMuted }]}>
              {t('subscription.comingSoon')}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  currentPlan: { gap: 4 },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  planName: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  planCard: { gap: 10 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  planTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planCardTitle: { fontSize: 17, fontWeight: '700' },
  planPrice: { fontSize: 15, fontWeight: '700' },
  popularBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  popularText: { fontSize: 10, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14 },
  comingSoon: { textAlign: 'center', fontSize: 12, marginTop: 10 },
});
