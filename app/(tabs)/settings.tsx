import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

const PLAN_VARIANTS: Record<string, 'muted' | 'primary' | 'success'> = {
  free: 'muted',
  premium: 'primary',
  family: 'success',
};

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Profile card */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <Badge
            label={user.plan}
            variant={PLAN_VARIANTS[user.plan] ?? 'muted'}
          />
        </Card>

        {/* Menu items */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Card style={styles.menuCard}>
            <MenuItem icon="person-outline" label="Edit profile" />
            <Separator />
            <MenuItem icon="key-outline" label="Change password" />
            <Separator />
            <MenuItem icon="card-outline" label="Subscription" />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App</Text>
          <Card style={styles.menuCard}>
            <MenuItem icon="notifications-outline" label="Notifications" />
            <Separator />
            <MenuItem icon="moon-outline" label="Appearance" />
            <Separator />
            <MenuItem icon="shield-outline" label="Privacy" />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <Card style={styles.menuCard}>
            <MenuItem icon="help-circle-outline" label="Help & FAQ" />
            <Separator />
            <MenuItem icon="information-circle-outline" label="About LifeVault" />
          </Card>
        </View>

        {/* Logout */}
        <Button
          label="Sign out"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>LifeVault Mobile v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={Colors.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
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
    color: Colors.text,
  },
  email: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
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
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.background,
    marginHorizontal: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    paddingBottom: 8,
  },
});
