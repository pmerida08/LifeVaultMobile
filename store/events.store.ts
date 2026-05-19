import { create } from 'zustand';
import { fetchEvents } from '../lib/api';
import type { CalendarEvent } from '../types';

interface EventsStore {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
}

export const useEventsStore = create<EventsStore>((set) => ({
  events: [],
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const events = await fetchEvents(userId);
      set({ events, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
