import { renderHook, act } from '@testing-library/react-native';
import { useEventsStore } from '../../store/events.store';
import type { CalendarEvent } from '../../types';

jest.mock('../../lib/api', () => ({
  fetchEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

jest.mock('../../lib/google-auth', () => ({
  isConnected: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../lib/google-calendar', () => ({
  createGoogleEvent: jest.fn(),
  updateGoogleEvent: jest.fn(),
  deleteGoogleEvent: jest.fn(),
}));

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: '1',
    user_id: 'u1',
    title: 'Evento de prueba',
    start_at: '2025-01-01T10:00:00Z',
    end_at: '2025-01-01T11:00:00Z',
    all_day: false,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useEventsStore', () => {
  beforeEach(() => {
    useEventsStore.setState({ events: [], loading: false, error: null });
    jest.clearAllMocks();
  });

  // ── load ──────────────────────────────────────────────────────────────────

  it('load establece los eventos en éxito', async () => {
    const { fetchEvents } = require('../../lib/api');
    const events = [makeEvent({ id: '1' }), makeEvent({ id: '2' })];
    fetchEvents.mockResolvedValueOnce(events);

    const { result } = renderHook(() => useEventsStore());
    await act(async () => { await result.current.load('u1'); });

    expect(result.current.events).toEqual(events);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('load establece el error en fallo', async () => {
    const { fetchEvents } = require('../../lib/api');
    fetchEvents.mockRejectedValueOnce(new Error('Sin conexión'));

    const { result } = renderHook(() => useEventsStore());
    await act(async () => { await result.current.load('u1'); });

    expect(result.current.error).toBe('Sin conexión');
    expect(result.current.loading).toBe(false);
    expect(result.current.events).toEqual([]);
  });

  // ── create ──────────────────────────────────────────────────────────────────

  it('create añade el evento al principio de la lista', async () => {
    const { createEvent } = require('../../lib/api');
    const nuevo = makeEvent({ id: '2', title: 'Nuevo' });
    createEvent.mockResolvedValueOnce(nuevo);
    useEventsStore.setState({ events: [makeEvent({ id: '1' })] });

    const { result } = renderHook(() => useEventsStore());
    await act(async () => {
      await result.current.create('u1', {
        title: 'Nuevo',
        description: undefined,
        start_at: '2025-01-02T10:00:00Z',
        end_at: '2025-01-02T11:00:00Z',
        all_day: false,
        color: undefined,
      });
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].id).toBe('2');
  });

  it('create no llama a Google Calendar si no hay conexión', async () => {
    const { createEvent } = require('../../lib/api');
    const { createGoogleEvent } = require('../../lib/google-calendar');
    createEvent.mockResolvedValueOnce(makeEvent({ id: '2' }));

    const { result } = renderHook(() => useEventsStore());
    await act(async () => {
      await result.current.create('u1', {
        title: 'X',
        description: undefined,
        start_at: '2025-01-02T10:00:00Z',
        end_at: '2025-01-02T11:00:00Z',
        all_day: false,
        color: undefined,
      });
    });

    expect(createGoogleEvent).not.toHaveBeenCalled();
  });

  it('create registra el error sin romper el estado', async () => {
    const { createEvent } = require('../../lib/api');
    createEvent.mockRejectedValueOnce(new Error('Fallo al crear'));

    const { result } = renderHook(() => useEventsStore());
    await act(async () => {
      await result.current.create('u1', {
        title: 'X',
        description: undefined,
        start_at: '2025-01-02T10:00:00Z',
        end_at: '2025-01-02T11:00:00Z',
        all_day: false,
        color: undefined,
      });
    });

    expect(result.current.error).toBe('Fallo al crear');
    expect(result.current.events).toEqual([]);
  });

  // ── update ──────────────────────────────────────────────────────────────────

  it('update modifica el título optimistamente', async () => {
    const { updateEvent } = require('../../lib/api');
    updateEvent.mockResolvedValueOnce(undefined);
    useEventsStore.setState({ events: [makeEvent({ id: '1', title: 'Viejo' })] });

    const { result } = renderHook(() => useEventsStore());
    await act(async () => {
      await result.current.update('1', { title: 'Actualizado' });
    });

    expect(result.current.events[0].title).toBe('Actualizado');
  });

  it('update solo modifica el evento correcto', async () => {
    const { updateEvent } = require('../../lib/api');
    updateEvent.mockResolvedValueOnce(undefined);
    useEventsStore.setState({
      events: [
        makeEvent({ id: '1', title: 'A' }),
        makeEvent({ id: '2', title: 'B' }),
      ],
    });

    const { result } = renderHook(() => useEventsStore());
    await act(async () => {
      await result.current.update('1', { title: 'A actualizado' });
    });

    expect(result.current.events[0].title).toBe('A actualizado');
    expect(result.current.events[1].title).toBe('B');
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  it('remove elimina el evento del estado inmediatamente', async () => {
    const { deleteEvent } = require('../../lib/api');
    deleteEvent.mockResolvedValueOnce(undefined);
    useEventsStore.setState({
      events: [makeEvent({ id: '1' }), makeEvent({ id: '2' })],
    });

    const { result } = renderHook(() => useEventsStore());
    await act(async () => { await result.current.remove('1'); });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('2');
  });

  it('remove solo elimina el evento correcto', async () => {
    const { deleteEvent } = require('../../lib/api');
    deleteEvent.mockResolvedValueOnce(undefined);
    useEventsStore.setState({
      events: [
        makeEvent({ id: '1' }),
        makeEvent({ id: '2' }),
        makeEvent({ id: '3' }),
      ],
    });

    const { result } = renderHook(() => useEventsStore());
    await act(async () => { await result.current.remove('2'); });

    expect(result.current.events.map((e) => e.id)).toEqual(['1', '3']);
  });
});
