import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { useDocumentsStore } from '../../store/documents.store';
import { useTasksStore } from '../../store/tasks.store';
import { useEventsStore } from '../../store/events.store';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import { useThemeColors } from '../../constants/colors';
import type { Task, CalendarEvent } from '../../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function priorityVariant(priority: Task['priority']) {
  return priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'success';
}

const SUMMARY_ICONS = [
  { icon: 'folder' as const, label: 'Documentos' },
  { icon: 'checkmark-circle' as const, label: 'Pendientes' },
  { icon: 'calendar' as const, label: 'Eventos' },
];

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { notes, load: loadDocs } = useDocumentsStore();
  const { tasks, load: loadTasks } = useTasksStore();
  const { events, load: loadEvents } = useEventsStore();

  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([loadDocs(user.id), loadTasks(user.id), loadEvents(user.id)]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadAll().finally(() => setInitialLoad(false));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const styles = createStyles(colors);

  if (initialLoad) return <SkeletonDashboard />;

  const pendingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 3);
  const upcomingEvents = events.slice(0, 2);
  const summaryValues = [
    notes.length,
    tasks.filter((t) => t.status !== 'done').length,
    events.length,
  ];
  const summaryColors = [colors.primary, colors.warning, colors.success];

  return (
    <ScreenLayout refreshing={refreshing} onRefresh={onRefresh}>
      {/* Greeting */}
      <Animated.View entering={FadeInDown.duration(500).delay(0)} style={styles.greeting}>
        <Text style={styles.greetingText}>
          {getGreeting()}, {user?.name?.split(' ')[0] ?? 'ahí'}
        </Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Animated.View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        {SUMMARY_ICONS.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={FadeInDown.duration(500).delay(100 + i * 80)}
            style={styles.summaryFlex}
          >
            <Card style={styles.summaryCard} elevated>
              <View style={[styles.summaryIconWrap, { backgroundColor: `${summaryColors[i]}18` }]}>
                <Ionicons name={item.icon} size={20} color={summaryColors[i]} accessibilityElementsHidden />
              </View>
              <Text style={styles.summaryCount}>{summaryValues[i]}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </Card>
          </Animated.View>
        ))}
      </View>

      {/* Pending tasks */}
      <Animated.View entering={FadeInUp.duration(500).delay(340)} style={styles.section}>
        <Text style={styles.sectionTitle}>Tareas recientes</Text>
        {pendingTasks.length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={28} color={colors.textMuted} accessibilityElementsHidden />
              <Text style={styles.emptyText}>Sin tareas pendientes</Text>
            </View>
          </Card>
        ) : (
          pendingTasks.map((task, i) => (
            <Animated.View key={task.id} entering={FadeInUp.duration(400).delay(360 + i * 60)}>
              <Card style={styles.taskCard}>
                <View style={styles.taskRow}>
                  <Ionicons
                    name={task.status === 'in_progress' ? 'time' : 'ellipse-outline'}
                    size={18}
                    color={task.status === 'in_progress' ? colors.warning : colors.textMuted}
                    accessibilityElementsHidden
                  />
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  <Badge label={task.priority} variant={priorityVariant(task.priority)} />
                </View>
                {task.due_date && (
                  <Text style={styles.taskDue}>Vence {formatDate(task.due_date)}</Text>
                )}
              </Card>
            </Animated.View>
          ))
        )}
      </Animated.View>

      {/* Upcoming events */}
      <Animated.View entering={FadeInUp.duration(500).delay(480)} style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos eventos</Text>
        {upcomingEvents.length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={28} color={colors.textMuted} accessibilityElementsHidden />
              <Text style={styles.emptyText}>Sin eventos próximos</Text>
            </View>
          </Card>
        ) : (
          upcomingEvents.map((event: CalendarEvent, i) => (
            <Animated.View key={event.id} entering={FadeInUp.duration(400).delay(500 + i * 60)}>
              <Card style={styles.eventCard}>
                <View
                  style={[styles.eventColorBar, { backgroundColor: event.color ?? colors.primary }]}
                />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventDate}>{formatDate(event.start_at)}</Text>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </Animated.View>
    </ScreenLayout>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    greeting: {
      paddingVertical: 8,
      gap: 4,
    },
    greetingText: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    dateText: {
      fontSize: 14,
      color: colors.textMuted,
      textTransform: 'capitalize',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
    },
    summaryFlex: {
      flex: 1,
    },
    summaryCard: {
      alignItems: 'center',
      gap: 6,
      paddingVertical: 18,
    },
    summaryIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryCount: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    taskCard: {
      gap: 4,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    taskTitle: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    taskDue: {
      fontSize: 12,
      color: colors.textMuted,
      marginLeft: 28,
    },
    eventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
    },
    eventColorBar: {
      width: 4,
      height: 40,
      borderRadius: 2,
    },
    eventContent: {
      flex: 1,
      gap: 2,
    },
    eventTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    eventDate: {
      fontSize: 13,
      color: colors.textMuted,
    },
    emptyState: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
