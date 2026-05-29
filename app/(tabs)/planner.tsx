import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput as RNTextInput,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { useTasksStore } from '../../store/tasks.store';
import { useEventsStore } from '../../store/events.store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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

const PRIORITY_VARIANTS: Record<Task['priority'], 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
};

const EVENT_COLORS = [
  '#3730AB', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateInput(str: string): string | undefined {
  if (!str.trim()) return undefined;
  const normalized = str.includes('T') ? str : str.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function formatDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
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
            <Text style={[styles.taskDue, { color: colors.textMuted }]}>
              {dueLabel} {formatDisplay(task.due_date)}
            </Text>
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
        <Text style={[styles.eventDate, { color: colors.textMuted }]}>{formatDisplay(event.start_at)}</Text>
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
  const [priority, setPriority] = useState<Task['priority']>(isEdit ? state.task.priority : 'medium');
  const [dueDate, setDueDate] = useState(isEdit ? formatDateInput(state.task.due_date) : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: parseDateInput(dueDate),
    });
    setLoading(false);
    onClose();
  };

  const priorities: Task['priority'][] = ['low', 'medium', 'high'];

  return (
    <View style={[styles.modal, { backgroundColor: colors.surface }]}>
      <Text style={[styles.modalTitle, { color: colors.text }]}>{isEdit ? t('planner.editTask') : t('planner.newTask')}</Text>
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
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('planner.priority')}</Text>
      <View style={styles.chipRow}>
        {priorities.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPriority(p)}
            style={[
              styles.chip,
              { backgroundColor: priority === p ? colors.primary : colors.background },
            ]}
          >
            <Text style={[styles.chipText, { color: priority === p ? colors.white : colors.textMuted }]}>
              {p === 'low' ? t('planner.priorityLow') : p === 'medium' ? t('planner.priorityMedium') : t('planner.priorityHigh')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('planner.dueDate')}</Text>
      <RNTextInput
        style={[styles.dateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder={t('planner.dateFormat')}
        placeholderTextColor={colors.textMuted}
        keyboardType="numbers-and-punctuation"
      />
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
    </View>
  );
}

// ─── EventModal ───────────────────────────────────────────────────────────────

function EventModal({
  state,
  onClose,
  onSubmit,
  onError,
}: {
  state: Exclude<EventModalState, null>;
  onClose: () => void;
  onSubmit: (data: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const colors = useThemeColors();
  const t = useT();
  const isEdit = state.mode === 'edit';
  const [title, setTitle] = useState(isEdit ? state.event.title : '');
  const [description, setDescription] = useState(isEdit ? (state.event.description ?? '') : '');
  const [startAt, setStartAt] = useState(isEdit ? formatDateInput(state.event.start_at) : '');
  const [endAt, setEndAt] = useState(isEdit ? formatDateInput(state.event.end_at) : '');
  const [allDay, setAllDay] = useState(isEdit ? state.event.all_day : false);
  const [color, setColor] = useState(isEdit ? (state.event.color ?? EVENT_COLORS[0]) : EVENT_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !startAt.trim()) return;
    const parsedStart = parseDateInput(startAt);
    if (!parsedStart) {
      onError(t('planner.invalidDate'));
      return;
    }
    setLoading(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      start_at: parsedStart,
      end_at: parseDateInput(endAt),
      all_day: allDay,
      color,
    });
    setLoading(false);
    onClose();
  };

  return (
    <ScrollView
      style={[styles.modal, { backgroundColor: colors.surface }]}
      contentContainerStyle={[styles.modalContent, { gap: 16, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.modalTitle, { color: colors.text }]}>{isEdit ? t('planner.editEvent') : t('planner.newEvent')}</Text>
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
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('planner.eventStart')}</Text>
      <RNTextInput
        style={[styles.dateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        value={startAt}
        onChangeText={setStartAt}
        placeholder={t('planner.dateFormat')}
        placeholderTextColor={colors.textMuted}
        keyboardType="numbers-and-punctuation"
      />
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('planner.eventEnd')}</Text>
      <RNTextInput
        style={[styles.dateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        value={endAt}
        onChangeText={setEndAt}
        placeholder={t('planner.dateFormat')}
        placeholderTextColor={colors.textMuted}
        keyboardType="numbers-and-punctuation"
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
          disabled={!title.trim() || !startAt.trim()}
          style={styles.modalBtn}
        />
      </View>
    </ScrollView>
  );
}

// ─── PlannerScreen ────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { show: showToast } = useToast();
  const { user } = useAuthStore();
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleDeleteTask = useCallback((taskId: string) => {
    removeTask(taskId).then(() => showToast(t('planner.taskDeleted'), 'success'));
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

  const grouped = (['todo', 'in_progress', 'done'] as StatusGroup[]).map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
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
                events.map((event, ei) => (
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
        <View style={styles.modalOverlay}>
          {taskModal && (
            <TaskModal
              state={taskModal}
              onClose={() => setTaskModal(null)}
              onSubmit={handleTaskSubmit}
            />
          )}
        </View>
      </Modal>

      {/* Event modal */}
      <Modal
        visible={eventModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEventModal(null)}
      >
        <View style={styles.modalOverlay}>
          {eventModal && (
            <EventModal
              state={eventModal}
              onClose={() => setEventModal(null)}
              onSubmit={handleEventSubmit}
              onError={(msg) => showToast(msg, 'error')}
            />
          )}
        </View>
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
  modalContent: {},
  modalTitle: { fontSize: 20, fontWeight: '800' },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  dateInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
