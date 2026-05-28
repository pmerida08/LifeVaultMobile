import { create } from 'zustand';
import { getErrorMessage } from '../lib/errors';
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../lib/api';
import { createGoogleTask, updateGoogleTask, deleteGoogleTask } from '../lib/google-tasks';
import { isConnected } from '../lib/google-auth';
import type { Task } from '../types';

interface TasksStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  create: (
    userId: string,
    payload: Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>
  ) => Promise<void>;
  updateStatus: (taskId: string, status: Task['status']) => Promise<void>;
  update: (
    taskId: string,
    payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>>
  ) => Promise<void>;
  remove: (taskId: string) => Promise<void>;
  pending: () => Task[];
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const tasks = await fetchTasks(userId);
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  create: async (userId, payload) => {
    try {
      const task = await createTask(userId, payload);
      set((state) => ({ tasks: [task, ...state.tasks] }));

      if (await isConnected()) {
        const gt = await createGoogleTask({
          title: task.title,
          notes: task.description,
          status: 'needsAction',
          ...(task.due_date ? { due: task.due_date } : {}),
        });
        if (gt.id) {
          await updateTask(task.id, { google_task_id: gt.id });
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === task.id ? { ...t, google_task_id: gt.id } : t
            ),
          }));
        }
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  updateStatus: async (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
    try {
      await updateTaskStatus(taskId, status);
      const task = get().tasks.find((t) => t.id === taskId);
      if (task?.google_task_id && (await isConnected())) {
        await updateGoogleTask(task.google_task_id, {
          status: status === 'done' ? 'completed' : 'needsAction',
        });
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  update: async (taskId, payload) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...payload } : t)),
    }));
    try {
      await updateTask(taskId, payload);
      const task = get().tasks.find((t) => t.id === taskId);
      if (task?.google_task_id && (await isConnected())) {
        await updateGoogleTask(task.google_task_id, {
          title: payload.title ?? task.title,
          notes: payload.description ?? task.description,
          ...(payload.due_date !== undefined ? { due: payload.due_date ?? undefined } : {}),
        });
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  remove: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    try {
      await deleteTask(taskId);
      if (task?.google_task_id && (await isConnected())) {
        await deleteGoogleTask(task.google_task_id);
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  pending: () => get().tasks.filter((t) => t.status !== 'done'),
}));
