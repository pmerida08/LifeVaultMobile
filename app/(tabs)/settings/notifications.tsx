import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { useToast } from '../../../lib/toast';
import { Card } from '../../../components/ui/Card';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

const KEYS = {
  push: '@lv_notif_push',
  tasks: '@lv_notif_tasks',
  events: '@lv_notif_events',
};

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { show: showToast } = useToast();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [taskReminders, setTaskReminders] = useState(false);
  const [eventReminders, setEventReminders] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const [push, tasks, events] = await Promise.all([
        AsyncStorage.getItem(KEYS.push),
        AsyncStorage.getItem(KEYS.tasks),
        AsyncStorage.getItem(KEYS.events),
      ]);
      setPushEnabled(push === 'true');
      setTaskReminders(tasks === 'true');
      setEventReminders(events === 'true');
    })();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      showToast(t('notifications.permissionDenied'), 'error');
      return false;
    }
    return true;
  };

  const togglePush = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setPushEnabled(value);
    if (!value) {
      setTaskReminders(false);
      setEventReminders(false);
      await AsyncStorage.multiSet([[KEYS.tasks, 'false'], [KEYS.events, 'false']]);
    }
    await AsyncStorage.setItem(KEYS.push, String(value));
  };

  const toggleTasks = async (value: boolean) => {
    setTaskReminders(value);
    await AsyncStorage.setItem(KEYS.tasks, String(value));
  };

  const toggleEvents = async (value: boolean) => {
    setEventReminders(value);
    await AsyncStorage.setItem(KEYS.events, String(value));
  };

  const trackColor = { false: colors.border, true: colors.primary };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.notifications')} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {permissionDenied && (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.banner, { backgroundColor: colors.danger + '20' }]}>
            <Text style={[styles.bannerText, { color: colors.danger }]}>
              {t('notifications.permissionDenied')}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>{t('notifications.push')}</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>{t('notifications.pushDesc')}</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={trackColor}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(140)}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('notifications.reminders')}</Text>
          <Card style={[styles.card, styles.menuCard]}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: pushEnabled ? colors.text : colors.textMuted }]}>
                  {t('notifications.tasks')}
                </Text>
              </View>
              <Switch
                value={taskReminders}
                onValueChange={toggleTasks}
                disabled={!pushEnabled}
                trackColor={trackColor}
                thumbColor={colors.white}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: pushEnabled ? colors.text : colors.textMuted }]}>
                  {t('notifications.events')}
                </Text>
              </View>
              <Switch
                value={eventReminders}
                onValueChange={toggleEvents}
                disabled={!pushEnabled}
                trackColor={trackColor}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  banner: { borderRadius: 12, padding: 14 },
  bannerText: { fontSize: 13, lineHeight: 18 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, paddingLeft: 4, marginBottom: 8 },
  card: { gap: 0 },
  menuCard: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15 },
  rowDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});
