import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../../store/auth.store';
import { useThemeStore, ThemePreference } from '../../../store/theme.store';
import { useI18nStore, useT, LangPreference } from '../../../store/i18n.store';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useThemeColors } from '../../../constants/colors';
import { useToast } from '../../../lib/toast';

const PLAN_VARIANTS: Record<string, 'muted' | 'primary' | 'success'> = {
  free: 'muted',
  premium: 'primary',
  family: 'success',
};

// ─── Appearance Modal ─────────────────────────────────────────────────────────

function AppearanceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const t = useT();
  const { theme, setTheme } = useThemeStore();

  const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; description: string }[] = [
    { value: 'system', label: t('settings.themeSystem'), icon: 'phone-portrait-outline', description: t('settings.themeSystemDesc') },
    { value: 'light',  label: t('settings.themeLight'),  icon: 'sunny-outline',          description: t('settings.themeLightDesc')  },
    { value: 'dark',   label: t('settings.themeDark'),   icon: 'moon-outline',           description: t('settings.themeDarkDesc')   },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('settings.appearanceTitle')}</Text>
          <View style={styles.optionList}>
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setTheme(opt.value); onClose(); }}
                  activeOpacity={0.7}
                  style={[
                    styles.optionRow,
                    { borderColor: active ? colors.primary : colors.border },
                    active && { backgroundColor: colors.primarySurface },
                  ]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: active ? colors.primary : colors.surfaceElevated }]}>
                    <Ionicons name={opt.icon} size={20} color={active ? colors.white : colors.textMuted} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{opt.description}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Language Modal ───────────────────────────────────────────────────────────

function LanguageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const t = useT();
  const { lang, setLang } = useI18nStore();

  const LANG_OPTIONS: { value: LangPreference; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; description: string }[] = [
    { value: 'es', label: t('settings.langEs'), icon: 'language-outline', description: t('settings.langEsDesc') },
    { value: 'en', label: t('settings.langEn'), icon: 'globe-outline',    description: t('settings.langEnDesc') },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('settings.languageTitle')}</Text>
          <View style={styles.optionList}>
            {LANG_OPTIONS.map((opt) => {
              const active = lang === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setLang(opt.value); onClose(); }}
                  activeOpacity={0.7}
                  style={[
                    styles.optionRow,
                    { borderColor: active ? colors.primary : colors.border },
                    active && { backgroundColor: colors.primarySurface },
                  ]}
                >
                  <View style={[styles.optionIcon, { backgroundColor: active ? colors.primary : colors.surfaceElevated }]}>
                    <Ionicons name={opt.icon} size={20} color={active ? colors.white : colors.textMuted} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{opt.description}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Menu helpers ─────────────────────────────────────────────────────────────

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={colors.textMuted} />
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Separator() {
  const colors = useThemeColors();
  return <View style={[styles.separator, { backgroundColor: colors.background }]} />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { user, logout } = useAuthStore();
  const { show: showToast } = useToast();
  const [appearanceVisible, setAppearanceVisible] = useState(false);
  const [languageVisible, setLanguageVisible] = useState(false);

  const handleLogout = () => {
    showToast(t('settings.loggedOut'), 'info');
    setTimeout(async () => {
      await logout();
      router.replace('/(auth)/login');
    }, 600);
  };

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <Card elevated style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.white }]}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
              <Text style={[styles.email, { color: colors.textMuted }]}>{user.email}</Text>
            </View>
            <Badge label={user.plan} variant={PLAN_VARIANTS[user.plan] ?? 'muted'} />
          </Card>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('settings.accountSection')}</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label={t('settings.editProfile')}
              onPress={() => router.push('/(tabs)/settings/edit-profile')}
            />
            <Separator />
            <MenuItem
              icon="key-outline"
              label={t('settings.changePassword')}
              onPress={() => router.push('/(tabs)/settings/change-password')}
            />
            <Separator />
            <MenuItem
              icon="card-outline"
              label={t('settings.subscription')}
              onPress={() => router.push('/(tabs)/settings/subscription')}
            />
          </Card>
        </Animated.View>

        {/* App */}
        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('settings.appSection')}</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              label={t('settings.notifications')}
              onPress={() => router.push('/(tabs)/settings/notifications')}
            />
            <Separator />
            <MenuItem
              icon="moon-outline"
              label={t('settings.appearance')}
              onPress={() => setAppearanceVisible(true)}
            />
            <Separator />
            <MenuItem
              icon="language-outline"
              label={t('settings.language')}
              onPress={() => setLanguageVisible(true)}
            />
            <Separator />
            <MenuItem
              icon="shield-outline"
              label={t('settings.privacy')}
              onPress={() => router.push('/(tabs)/settings/privacy')}
            />
          </Card>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('settings.supportSection')}</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              label={t('settings.helpFaq')}
              onPress={() => router.push('/(tabs)/settings/help-faq')}
            />
            <Separator />
            <MenuItem
              icon="information-circle-outline"
              label={t('settings.about')}
              onPress={() => router.push('/(tabs)/settings/about')}
            />
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <Button
            label={t('settings.signOut')}
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </Animated.View>

        <Text style={[styles.version, { color: colors.textMuted }]}>{t('settings.version')}</Text>
      </ScrollView>

      <AppearanceModal
        visible={appearanceVisible}
        onClose={() => setAppearanceVisible(false)}
      />
      <LanguageModal
        visible={languageVisible}
        onClose={() => setLanguageVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '700' },
  email: { fontSize: 13 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuLabel: { flex: 1, fontSize: 15 },
  separator: { height: 1, marginHorizontal: 16 },
  logoutButton: { marginTop: 8 },
  version: { textAlign: 'center', fontSize: 12, paddingBottom: 8 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  optionList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12,
  },
});
