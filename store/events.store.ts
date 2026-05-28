import { create } from 'zustand';
import { getErrorMessage } from '../lib/errors';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../lib/api';
import {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from '../lib/google-calendar';
import { isConnected } from '../lib/google-auth';
import type { CalendarEvent } from '../types';

interface EventsStore {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  create: (
    userId: string,
    payload: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>
  ) => Promise<void>;
  update: (
    eventId: string,
    payload: Partial<Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>>
  ) => Promise<void>;
  remove: (eventId: string) => Promise<void>;
}

function toGoogleEventBody(
  title: string,
  description: string | undefined,
  startAt: string,
  endAt: string | undefined,
  allDay: boolean
) {
  return {
    summary: title,
    description,
    start: allDay
      ? { date: startAt.split('T')[0] }
      : { dateTime: startAt, timeZone: 'UTC' },
    end: allDay
      ? { date: (endAt ?? startAt).split('T')[0] }
      : { dateTime: endAt ?? startAt, timeZone: 'UTC' },
  };
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const events = await fetchEvents(userId);
      set({ events, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  create: async (userId, payload) => {
    try {
      const event = await createEvent(userId, payload);
      set((state) => ({ events: [event, ...state.events] }));

      if (await isConnected()) {
        const ge = await createGoogleEvent(
          toGoogleEventBody(
            event.title,
            event.description,
            event.start_at,
            event.end_at,
            event.all_day
          )
        );
        if (ge.id) {
          await updateEvent(event.id, { google_event_id: ge.id });
          set((state) => ({
            events: state.events.map((e) =>
              e.id === event.id ? { ...e, google_event_id: ge.id } : e
            ),
          }));
        }
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  update: async (eventId, payload) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, ...payload } : e)),
    }));
    try {
      await updateEvent(eventId, payload);
      const event = get().events.find((e) => e.id === eventId);
      if (event?.google_event_id && (await isConnected())) {
        await updateGoogleEvent(
          event.google_event_id,
          toGoogleEventBody(
            payload.title ?? event.title,
            payload.description ?? event.description,
            payload.start_at ?? event.start_at,
            payload.end_at ?? event.end_at,
            payload.all_day ?? event.all_day
          )
        );
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },

  remove: async (eventId) => {
    const event = get().events.find((e) => e.id === eventId);
    set((state) => ({ events: state.events.filter((e) => e.id !== eventId) }));
    try {
      await deleteEvent(eventId);
      if (event?.google_event_id && (await isConnected())) {
        await deleteGoogleEvent(event.google_event_id);
      }
    } catch (e) {
      set({ error: getErrorMessage(e) });
    }
  },
}));
