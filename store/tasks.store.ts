import { create } from 'zustand';
import { fetchTasks, createTask, updateTaskStatus } from '../lib/api';
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
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  create: async (userId, payload) => {
    try {
      const task = await createTask(userId, payload);
      set((state) => ({ tasks: [task, ...state.tasks] }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updateStatus: async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status } : t
        ),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  pending: () => get().tasks.filter((t) => t.status !== 'done'),
}));
