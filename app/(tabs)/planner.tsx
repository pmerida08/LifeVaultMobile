import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
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
import { Colors } from '../../constants/colors';
import type { Task } from '../../types';

type StatusGroup = 'todo' | 'in_progress' | 'done';

const STATUS_LABELS: Record<StatusGroup, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_VARIANTS: Record<Task['priority'], 'danger' | 'warning' | 'success'> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TaskItem({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, current: Task['status']) => void;
}) {
  const nextStatus: Task['status'] =
    task.status === 'todo'
      ? 'in_progress'
      : task.status === 'in_progress'
      ? 'done'
      : 'todo';

  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskRow}>
        <TouchableOpacity onPress={() => onToggle(task.id, nextStatus)}>
          <Ionicons
            name={
              task.status === 'done'
                ? 'checkmark-circle'
                : task.status === 'in_progress'
                ? 'time'
                : 'ellipse-outline'
            }
            size={22}
            color={
              task.status === 'done'
                ? Colors.success
                : task.status === 'in_progress'
                ? Colors.warning
                : Colors.textMuted
            }
          />
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              task.status === 'done' && styles.taskTitleDone,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.due_date && (
            <Text style={styles.taskDue}>Due {formatDate(task.due_date)}</Text>
          )}
        </View>
        <Badge label={task.priority} variant={PRIORITY_VARIANTS[task.priority]} />
      </View>
    </Card>
  );
}

export default function PlannerScreen() {
  const { user } = useAuthStore();
  const { tasks, loading: tasksLoading, load: loadTasks, create, updateStatus } = useTasksStore();
  const { events, loading: eventsLoading, load: loadEvents } = useEventsStore();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks(user.id);
      loadEvents(user.id);
    }
  }, [user]);

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !user) return;
    setCreating(true);
    await create(user.id, { title: newTitle.trim(), priority: newPriority });
    setCreating(false);
    setNewTitle('');
    setShowModal(false);
  };

  const handleToggle = (taskId: string, nextStatus: Task['status']) => {
    updateStatus(taskId, nextStatus);
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
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Tasks section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tasks</Text>
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
                  <Text style={styles.emptyText}>No tasks</Text>
                ) : (
                  groupTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                  ))
                )}
              </View>
            ))
          )}
        </View>

        {/* Events section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {eventsLoading ? (
            <Spinner />
          ) : events.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No upcoming events</Text>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: event.color ?? Colors.primary },
                  ]}
                />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventDate}>{formatDate(event.start_at)}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create task modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Task</Text>
            <Input
              label="Title"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Task title..."
              autoFocus
            />
            <Text style={styles.priorityLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as Task['priority'][]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setNewPriority(p)}
                  style={[
                    styles.priorityChip,
                    newPriority === p && styles.priorityChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      newPriority === p && styles.priorityChipTextActive,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setShowModal(false)}
                style={styles.modalBtn}
              />
              <Button
                label="Create"
                onPress={handleCreateTask}
                loading={creating}
                disabled={!newTitle.trim()}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
  },
  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 13,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskCard: {
    paddingVertical: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskContent: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskDue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventContent: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  eventDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    paddingVertical: 4,
    paddingLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  priorityChipActive: {
    backgroundColor: Colors.primary,
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  priorityChipTextActive: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
  },
});
