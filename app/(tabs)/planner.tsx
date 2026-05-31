import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useTasksStore } from '../../store/tasks.store';
import { useEventsStore } from '../../store/events.store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DatePickerField } from '../../components/ui/DatePickerField';
import { SkeletonPlanner } from '../../components/ui/Skeleton';
import { GoogleConnectButton } from '../../components/GoogleConnectButton';
import { useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';
import { useToast } from '../../lib/toast';
import { isConnected } from '../../lib/google-auth';
import { importAllFromGoogle } from '../../lib/google-sync';
import type { Task, CalendarEvent } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusGroup = 'todo' | 'in_progress' | 'done';
type TaskModalState = null | { mode: 'create' } | { mode: 'edit'; task: Task };
type EventModalState = null | { mode: 'create' } | { mode: 'edit'; event: CalendarEvent };

const EVENT_COLORS = [
  '#3730AB', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDueColor(days: number): string {
  if (days < 0) return '#EF4444';
  if (days <= 3) return '#F97316';
  if (days <= 7) return '#EAB308';
  return '#22C55E';
}

function formatCountdown(days: number): string {
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`;
  }
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Mañana';
  if (days < 31) return `${days} días`;
  const months = Math.floor(days / 30);
  const rest = days % 30;
  const mStr = months === 1 ? '1 mes' : `${months} meses`;
  return rest > 0 ? `${mStr} y ${rest} día${rest > 1 ? 's' : ''}` : mStr;
}

function formatDisplay(iso: string): string {
  const d = new Date(iso);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  if (!hasTime) {
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── TaskItem ─────────────────────────────────────────────────────────────────

const TaskItem = React.memo(function TaskItem({
  task,
  dueLabel,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  dueLabel: string;
  onToggle: (id: string, next: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useThemeColors();
  const nextStatus: Task['status'] =
    task.status === 'todo' ? 'in_progress'
    : task.status === 'in_progress' ? 'done'
    : 'todo';

  return (
    <Card>
      <View style={styles.taskRow}>
        <TouchableOpacity onPress={() => onToggle(task.id, nextStatus)}>
          <Ionicons
            name={
              task.status === 'done' ? 'checkmark-circle'
              : task.status === 'in_progress' ? 'time'
              : 'ellipse-outline'
            }
            size={22}
            color={
              task.status === 'done' ? colors.success
              : task.status === 'in_progress' ? colors.warning
              : colors.textMuted
            }
          />
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              { color: task.status === 'done' ? colors.textMuted : colors.text },
              task.status === 'done' && styles.taskTitleDone,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.due_date && (
            <View style={styles.taskDueRow}>
              <Text style={[styles.taskDue, { color: colors.textMuted }]}>
                {dueLabel} {formatDisplay(task.due_date)}
              </Text>
              {task.status !== 'done' && (() => {
                const days = getDaysLeft(task.due_date!);
                const color = getDueColor(days);
                return (
                  <View style={[styles.countdownBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                    <Text style={[styles.countdownText, { color }]}>{formatCountdown(days)}</Text>
                  </View>
                );
              })()}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionBtn}>
          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );
});

// ─── EventItem ────────────────────────────────────────────────────────────────

const EventItem = React.memo(function EventItem({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <Card style={styles.eventCard}>
      <View style={[styles.eventDot, { backgroundColor: event.color ?? colors.primary }]} />
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <View style={styles.taskDueRow}>
          <Text style={[styles.eventDate, { color: colors.textMuted }]}>{formatDisplay(event.start_at)}</Text>
          {(() => {
            const days = getDaysLeft(event.start_at);
            const color = getDueColor(days);
            return (
              <View style={[styles.countdownBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                <Text style={[styles.countdownText, { color }]}>{formatCountdown(days)}</Text>
              </View>
            );
          })()}
        </View>
      </View>
      <TouchableOpacity onPress={() => onEdit(event)} style={styles.actionBtn}>
        <Ionicons name="create-outline" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(event.id)} style={styles.actionBtn}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
      </TouchableOpacity>
    </Card>
  );
});

// ─── TaskModal ────────────────────────────────────────────────────────────────

function TaskModal({
  state,
  onClose,
  onSubmit,
}: {
  state: Exclude<TaskModalState, null>;
  onClose: () => void;
  onSubmit: (data: Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>) => Promise<void>;
}) {
  const colors = useThemeColors();
  const t = useT();
  const isEdit = state.mode === 'edit';
  const [title, setTitle] = useState(isEdit ? state.task.title : '');
  const [description, setDescription] = useState(isEdit ? (state.task.description ?? '') : '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    isEdit && state.task.due_date ? new Date(state.task.due_date) : undefined
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: isEdit ? state.task.priority : 'medium',
      due_date: dueDate?.toISOString(),
    });
    setLoading(false);
    onClose();
  };

  return (
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable
        style={[styles.modal, { backgroundColor: colors.surface }]}
        onPress={(e) => e.stopPropagation()}
      >
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          {isEdit ? t('planner.editTask') : t('planner.newTask')}
        </Text>
        <Input
          label={t('planner.fieldTitle')}
          value={title}
          onChangeText={setTitle}
          placeholder={`${t('planner.fieldTitle')}...`}
          autoFocus
        />
        <Input
          label={t('planner.fieldDescription')}
          value={description}
          onChangeText={setDescription}
          placeholder="Notas..."
        />
        <DatePickerField
          label={t('planner.dueDate')}
          value={dueDate}
          onChange={setDueDate}
          placeholder="Sin fecha límite"
        />
        {isEdit && state.task.google_task_id && (
          <Text style={[styles.googleNote, { color: colors.textMuted }]}>
            La hora no está disponible en la API de Google Tasks. Puedes ajustarla aquí manualmente.
          </Text>
        )}
        <View style={styles.modalActions}>
          <Button label={t('planner.cancel')} variant="ghost" onPress={onClose} style={styles.modalBtn} />
          <Button
            label={isEdit ? t('planner.save') : t('planner.create')}
            onPress={handleSubmit}
            loading={loading}
            disabled={!title.trim()}
            style={styles.modalBtn}
          />
        </View>
      </Pressable>
    </Pressable>
  );
}

// ─── EventModal ───────────────────────────────────────────────────────────────

function EventModal({
  state,
  onClose,
  onSubmit,
}: {
  state: Exclude<EventModalState, null>;
  onClose: () => void;
  onSubmit: (data: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>) => Promise<void>;
}) {
  const colors = useThemeColors();
  const t = useT();
  const isEdit = state.mode === 'edit';
  const [title, setTitle] = useState(isEdit ? state.event.title : '');
  const [description, setDescription] = useState(isEdit ? (state.event.description ?? '') : '');
  const [startAt, setStartAt] = useState<Date | undefined>(
    isEdit ? new Date(state.event.start_at) : undefined
  );
  const [endAt, setEndAt] = useState<Date | undefined>(
    isEdit && state.event.end_at ? new Date(state.event.end_at) : undefined
  );
  const [allDay, setAllDay] = useState(isEdit ? state.event.all_day : false);
  const [color, setColor] = useState(isEdit ? (state.event.color ?? EVENT_COLORS[0]) : EVENT_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !startAt) return;
    setLoading(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      start_at: startAt.toISOString(),
      end_at: endAt?.toISOString(),
      all_day: allDay,
      color,
    });
    setLoading(false);
    onClose();
  };

  return (
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{ width: '100%' }}
      >
        <ScrollView
          style={[styles.modal, { backgroundColor: colors.surface }]}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {isEdit ? t('planner.editEvent') : t('planner.newEvent')}
          </Text>
          <Input
            label={t('planner.eventTitle')}
            value={title}
            onChangeText={setTitle}
            placeholder={`${t('planner.eventTitle')}...`}
            autoFocus
          />
          <Input
            label={t('planner.eventDescription')}
            value={description}
            onChangeText={setDescription}
            placeholder="Notas..."
          />
          <DatePickerField
            label={t('planner.eventStart')}
            value={startAt}
            onChange={setStartAt}
            placeholder="Seleccionar inicio"
          />
          <DatePickerField
            label={t('planner.eventEnd')}
            value={endAt}
            onChange={setEndAt}
            placeholder="Sin fecha de fin (opcional)"
            minimumDate={startAt}
          />
          <View style={styles.switchRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('planner.allDay')}</Text>
            <Switch
              value={allDay}
              onValueChange={setAllDay}
              trackColor={{ true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('planner.color')}</Text>
          <View style={styles.colorRow}>
            {EVENT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && { borderWidth: 3, borderColor: colors.text },
                ]}
              />
            ))}
          </View>
          <View style={styles.modalActions}>
            <Button label={t('planner.cancel')} variant="ghost" onPress={onClose} style={styles.modalBtn} />
            <Button
              label={isEdit ? t('planner.save') : t('planner.create')}
              onPress={handleSubmit}
              loading={loading}
              disabled={!title.trim() || !startAt}
              style={styles.modalBtn}
            />
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

// ─── PlannerScreen ────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const colors = useThemeColors();
  const t = useT();
  const router = useRouter();
  const { show: showToast } = useToast();
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ editTaskId?: string }>();
  const {
    tasks,
    loading: tasksLoading,
    load: loadTasks,
    create: createTask,
    updateStatus,
    update: updateTask,
    remove: removeTask,
  } = useTasksStore();
  const {
    events,
    loading: eventsLoading,
    load: loadEvents,
    create: createEvent,
    update: updateEvent,
    remove: removeEvent,
  } = useEventsStore();

  const [taskModal, setTaskModal] = useState<TaskModalState>(null);
  const [eventModal, setEventModal] = useState<EventModalState>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const STATUS_LABELS: Record<StatusGroup, string> = {
    todo: t('planner.statusTodo'),
    in_progress: t('planner.statusInProgress'),
    done: t('planner.statusDone'),
  };

  const loadAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([loadTasks(user.id), loadEvents(user.id)]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([loadTasks(user.id), loadEvents(user.id)]).finally(() => setInitialLoad(false));
    isConnected().then(setGoogleConnected);
  }, [user]);

  useEffect(() => {
    if (!user || !googleConnected) return;
    importAllFromGoogle(user.id)
      .then(() => loadAll())
      .catch(() => {});
  }, [googleConnected]);

  // Abrir edición de tarea desde el dashboard
  useFocusEffect(
    useCallback(() => {
      const editTaskId = params.editTaskId;
      if (!editTaskId) return;
      const task = tasks.find((tk) => tk.id === editTaskId);
      if (task) {
        setTaskModal({ mode: 'edit', task });
        router.setParams({ editTaskId: undefined });
      }
    }, [params.editTaskId, tasks])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleDeleteTask = useCallback((taskId: string) => {
    Alert.alert(
      t('planner.deleteTaskTitle'),
      t('planner.deleteTaskMsg'),
      [
        { text: t('planner.cancel'), style: 'cancel' },
        {
          text: t('planner.deleteConfirm'),
          style: 'destructive',
          onPress: () => removeTask(taskId).then(() => showToast(t('planner.taskDeleted'), 'success')),
        },
      ]
    );
  }, [removeTask, showToast]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    removeEvent(eventId).then(() => showToast(t('planner.eventDeleted'), 'success'));
  }, [removeEvent, showToast]);

  const handleTaskSubmit = useCallback(async (
    data: Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>
  ) => {
    if (!user) return;
    try {
      if (taskModal?.mode === 'edit') {
        await updateTask(taskModal.task.id, data);
        showToast(t('planner.taskUpdated'), 'success');
      } else {
        await createTask(user.id, data);
        showToast(t('planner.taskCreated'), 'success');
      }
    } catch {
      showToast(t('planner.taskSaveError'), 'error');
    }
  }, [user, taskModal, updateTask, createTask, showToast]);

  const handleEventSubmit = useCallback(async (
    data: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>
  ) => {
    if (!user) return;
    try {
      if (eventModal?.mode === 'edit') {
        await updateEvent(eventModal.event.id, data);
        showToast(t('planner.eventUpdated'), 'success');
      } else {
        await createEvent(user.id, data);
        showToast(t('planner.eventCreated'), 'success');
      }
    } catch {
      showToast(t('planner.eventSaveError'), 'error');
    }
  }, [user, eventModal, updateEvent, createEvent, showToast]);

  const sortByDate = (a: { due_date?: string | null }, b: { due_date?: string | null }) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  };

  const grouped = (['todo', 'in_progress', 'done'] as StatusGroup[]).map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status).sort(sortByDate),
  }));

  const isLoading = initialLoad && (tasksLoading || eventsLoading);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('planner.title')}</Text>
          <View style={styles.headerActions}>
            <GoogleConnectButton
              userId={user?.id ?? ''}
              connected={googleConnected}
              onConnectionChange={(connected) => {
                setGoogleConnected(connected);
                if (connected && user) loadAll();
              }}
            />
            <TouchableOpacity
              onPress={() => setEventModal({ mode: 'create' })}
              style={[styles.addBtn, styles.addBtnOutline, { backgroundColor: colors.surface, borderColor: colors.primary }]}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTaskModal({ mode: 'create' })}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {isLoading ? (
          <SkeletonPlanner />
        ) : (
          <>
            {/* Tasks */}
            <Animated.View entering={FadeInUp.duration(400).delay(80)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('planner.tasks')}</Text>
              {grouped.map(({ status, tasks: groupTasks }, gi) => (
                <Animated.View
                  key={status}
                  entering={FadeInUp.duration(350).delay(100 + gi * 60)}
                  style={styles.group}
                >
                  <View style={styles.groupHeader}>
                    <Text style={[styles.groupLabel, { color: colors.textMuted }]}>
                      {STATUS_LABELS[status]}
                    </Text>
                    <Text style={[styles.groupCount, { color: colors.textMuted, backgroundColor: colors.surface }]}>
                      {groupTasks.length}
                    </Text>
                  </View>
                  {groupTasks.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('planner.noTasks')}</Text>
                  ) : (
                    groupTasks.map((task, ti) => (
                      <Animated.View key={task.id} entering={FadeInUp.duration(300).delay(120 + ti * 40)}>
                        <TaskItem
                          task={task}
                          dueLabel={t('planner.due')}
                          onToggle={updateStatus}
                          onEdit={(tk) => setTaskModal({ mode: 'edit', task: tk })}
                          onDelete={handleDeleteTask}
                        />
                      </Animated.View>
                    ))
                  )}
                </Animated.View>
              ))}
            </Animated.View>

            {/* Events */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('planner.upcomingEvents')}</Text>
              {events.length === 0 ? (
                <Card>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('planner.noEvents')}</Text>
                </Card>
              ) : (
                [...events].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()).map((event, ei) => (
                  <Animated.View key={event.id} entering={FadeInUp.duration(300).delay(220 + ei * 40)}>
                    <EventItem
                      event={event}
                      onEdit={(e) => setEventModal({ mode: 'edit', event: e })}
                      onDelete={handleDeleteEvent}
                    />
                  </Animated.View>
                ))
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Task modal */}
      <Modal
        visible={taskModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskModal(null)}
      >
        {taskModal && (
          <TaskModal
            state={taskModal}
            onClose={() => setTaskModal(null)}
            onSubmit={handleTaskSubmit}
          />
        )}
      </Modal>

      {/* Event modal */}
      <Modal
        visible={eventModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEventModal(null)}
      >
        {eventModal && (
          <EventModal
            state={eventModal}
            onClose={() => setEventModal(null)}
            onSubmit={handleEventSubmit}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOutline: {
    borderWidth: 1,
  },
  section: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  group: { gap: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskContent: { flex: 1, gap: 2 },
  taskTitle: { fontSize: 15, fontWeight: '500' },
  taskTitleDone: { textDecorationLine: 'line-through' },
  taskDue: { fontSize: 12 },
  taskDueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  countdownBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  countdownText: { fontSize: 11, fontWeight: '700' },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventContent: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 12 },
  emptyText: { fontSize: 14, paddingVertical: 4, paddingLeft: 4 },
  actionBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    gap: 16,
  },
  modalScrollContent: {
    gap: 16,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
  googleNote: { fontSize: 12, fontStyle: 'italic', marginTop: 4, marginBottom: 4 },
});
