import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { useTasksStore } from '../../store/tasks.store';
import { useEventsStore } from '../../store/events.store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { GoogleConnectButton } from '../../components/GoogleConnectButton';
import { Colors } from '../../constants/colors';
import { isConnected } from '../../lib/google-auth';
import { importAllFromGoogle } from '../../lib/google-sync';
import type { Task, CalendarEvent } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusGroup = 'todo' | 'in_progress' | 'done';
type TaskModalState = null | { mode: 'create' } | { mode: 'edit'; task: Task };
type EventModalState = null | { mode: 'create' } | { mode: 'edit'; event: CalendarEvent };

const STATUS_LABELS: Record<StatusGroup, string> = {
  todo: 'Por hacer',
  in_progress: 'En progreso',
  done: 'Hecho',
};

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

function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string, next: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const nextStatus: Task['status'] =
    task.status === 'todo' ? 'in_progress'
    : task.status === 'in_progress' ? 'done'
    : 'todo';

  return (
    <Card style={styles.taskCard}>
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
              task.status === 'done' ? Colors.success
              : task.status === 'in_progress' ? Colors.warning
              : Colors.textMuted
            }
          />
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, task.status === 'done' && styles.taskTitleDone]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.due_date && (
            <Text style={styles.taskDue}>Vence {formatDisplay(task.due_date)}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionBtn}>
          <Ionicons name="create-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

// ─── EventItem ────────────────────────────────────────────────────────────────

function EventItem({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card style={styles.eventCard}>
      <View style={[styles.eventDot, { backgroundColor: event.color ?? Colors.primary }]} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventDate}>{formatDisplay(event.start_at)}</Text>
      </View>
      <TouchableOpacity onPress={() => onEdit(event)} style={styles.actionBtn}>
        <Ionicons name="create-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(event.id)} style={styles.actionBtn}>
        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
      </TouchableOpacity>
    </Card>
  );
}

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

  return (
    <View style={[styles.modal, styles.modalContent]}>
      <Text style={styles.modalTitle}>{isEdit ? 'Editar tarea' : 'Nueva tarea'}</Text>
      <Input
        label="Título"
        value={title}
        onChangeText={setTitle}
        placeholder="Título de la tarea..."
        autoFocus
      />
      <Input
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Notas..."
      />
      <Text style={styles.fieldLabel}>Fecha límite</Text>
      <RNTextInput
        style={styles.dateInput}
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="AAAA-MM-DD HH:MM"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numbers-and-punctuation"
      />
      <View style={styles.modalActions}>
        <Button label="Cancelar" variant="ghost" onPress={onClose} style={styles.modalBtn} />
        <Button
          label={isEdit ? 'Guardar' : 'Crear'}
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
}: {
  state: Exclude<EventModalState, null>;
  onClose: () => void;
  onSubmit: (data: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>) => Promise<void>;
}) {
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
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD HH:MM');
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
      style={styles.modal}
      contentContainerStyle={styles.modalContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.modalTitle}>{isEdit ? 'Editar evento' : 'Nuevo evento'}</Text>
      <Input
        label="Título"
        value={title}
        onChangeText={setTitle}
        placeholder="Nombre del evento..."
        autoFocus
      />
      <Input
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Notas..."
      />
      <Text style={styles.fieldLabel}>Inicio (AAAA-MM-DD HH:MM)</Text>
      <RNTextInput
        style={styles.dateInput}
        value={startAt}
        onChangeText={setStartAt}
        placeholder="2024-12-31 10:00"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numbers-and-punctuation"
      />
      <Text style={styles.fieldLabel}>Fin (AAAA-MM-DD HH:MM, opcional)</Text>
      <RNTextInput
        style={styles.dateInput}
        value={endAt}
        onChangeText={setEndAt}
        placeholder="2024-12-31 11:00"
        placeholderTextColor={Colors.textMuted}
        keyboardType="numbers-and-punctuation"
      />
      <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>Todo el día</Text>
        <Switch
          value={allDay}
          onValueChange={setAllDay}
          trackColor={{ true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>
      <Text style={styles.fieldLabel}>Color</Text>
      <View style={styles.colorRow}>
        {EVENT_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color === c && styles.colorDotSelected,
            ]}
          />
        ))}
      </View>
      <View style={styles.modalActions}>
        <Button label="Cancelar" variant="ghost" onPress={onClose} style={styles.modalBtn} />
        <Button
          label={isEdit ? 'Guardar' : 'Crear'}
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

  useEffect(() => {
    if (!user) return;
    loadTasks(user.id);
    loadEvents(user.id);
    isConnected().then(setGoogleConnected);
  }, [user]);

  useEffect(() => {
    if (!user || !googleConnected) return;
    importAllFromGoogle(user.id)
      .then(() => {
        loadTasks(user.id);
        loadEvents(user.id);
      })
      .catch(() => {});
  }, [googleConnected]);

  const handleDeleteTask = (taskId: string) => {
    Alert.alert('Eliminar tarea', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeTask(taskId) },
    ]);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert('Eliminar evento', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeEvent(eventId) },
    ]);
  };

  const handleTaskSubmit = async (
    data: Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>
  ) => {
    if (!user) return;
    if (taskModal?.mode === 'edit') {
      await updateTask(taskModal.task.id, data);
    } else {
      await createTask(user.id, data);
    }
  };

  const handleEventSubmit = async (
    data: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>
  ) => {
    if (!user) return;
    if (eventModal?.mode === 'edit') {
      await updateEvent(eventModal.event.id, data);
    } else {
      await createEvent(user.id, data);
    }
  };

  const grouped = (['todo', 'in_progress', 'done'] as StatusGroup[]).map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Planner</Text>
          <View style={styles.headerActions}>
            <GoogleConnectButton
              userId={user?.id ?? ''}
              connected={googleConnected}
              onConnectionChange={(connected) => {
                setGoogleConnected(connected);
                if (connected && user) {
                  loadTasks(user.id);
                  loadEvents(user.id);
                }
              }}
            />
            <TouchableOpacity
              onPress={() => setEventModal({ mode: 'create' })}
              style={[styles.addBtn, styles.addBtnOutline]}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTaskModal({ mode: 'create' })}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas</Text>
          {tasksLoading ? (
            <Spinner />
          ) : (
            grouped.map(({ status, tasks: groupTasks }) => (
              <View key={status} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupLabel}>{STATUS_LABELS[status]}</Text>
                  <Text style={styles.groupCount}>{groupTasks.length}</Text>
                </View>
                {groupTasks.length === 0 ? (
                  <Text style={styles.emptyText}>Sin tareas</Text>
                ) : (
                  groupTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={updateStatus}
                      onEdit={(t) => setTaskModal({ mode: 'edit', task: t })}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </View>
            ))
          )}
        </View>

        {/* Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos eventos</Text>
          {eventsLoading ? (
            <Spinner />
          ) : events.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Sin eventos próximos</Text>
            </Card>
          ) : (
            events.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onEdit={(e) => setEventModal({ mode: 'edit', event: e })}
                onDelete={handleDeleteEvent}
              />
            ))
          )}
        </View>
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
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  section: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Colors.text },
  group: { gap: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskCard: { paddingVertical: 10 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskContent: { flex: 1, gap: 2 },
  taskTitle: { fontSize: 15, fontWeight: '500', color: Colors.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskDue: { fontSize: 12, color: Colors.textMuted },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventContent: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  eventDate: { fontSize: 12, color: Colors.textMuted },
  emptyText: { color: Colors.textMuted, fontSize: 14, paddingVertical: 4, paddingLeft: 4 },
  actionBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalContent: { gap: 16, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },
  dateInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.text },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
