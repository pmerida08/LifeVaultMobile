import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useThemeColors } from '../../constants/colors';
import { useToast } from '../../lib/toast';

const PLAN_VARIANTS: Record<string, 'muted' | 'primary' | 'success'> = {
  free: 'muted',
  premium: 'primary',
  family: 'success',
};

function MenuItem({ icon, label }: { icon: string; label: string }) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
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

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { user, logout } = useAuthStore();
  const { show: showToast } = useToast();

  const handleLogout = () => {
    showToast('Sesión cerrada', 'info');
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
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
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
            <Badge
              label={user.plan}
              variant={PLAN_VARIANTS[user.plan] ?? 'muted'}
            />
          </Card>
        </Animated.View>

        {/* Menu items */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Account</Text>
          <Card style={styles.menuCard}>
            <MenuItem icon="person-outline" label="Edit profile" />
            <Separator />
            <MenuItem icon="key-outline" label="Change password" />
            <Separator />
            <MenuItem icon="card-outline" label="Subscription" />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>App</Text>
          <Card style={styles.menuCard}>
            <MenuItem icon="notifications-outline" label="Notifications" />
            <Separator />
            <MenuItem icon="moon-outline" label="Appearance" />
            <Separator />
            <MenuItem icon="shield-outline" label="Privacy" />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Support</Text>
          <Card style={styles.menuCard}>
            <MenuItem icon="help-circle-outline" label="Help & FAQ" />
            <Separator />
            <MenuItem icon="information-circle-outline" label="About LifeVault" />
          </Card>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <Button
            label="Sign out"
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </Animated.View>

        <Text style={[styles.version, { color: colors.textMuted }]}>LifeVault Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  email: {
    fontSize: 13,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 8,
  },
});
