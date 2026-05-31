import { renderHook, act } from '@testing-library/react-native';
import { useTasksStore } from '../../store/tasks.store';
import type { Task } from '../../types';

jest.mock('../../lib/api', () => ({
  fetchTasks: jest.fn(),
  createTask: jest.fn(),
  updateTaskStatus: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

jest.mock('../../lib/google-auth', () => ({
  isConnected: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../lib/google-tasks', () => ({
  createGoogleTask: jest.fn(),
  updateGoogleTask: jest.fn(),
  deleteGoogleTask: jest.fn(),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    user_id: 'u1',
    title: 'Tarea de prueba',
    status: 'todo',
    priority: 'medium',
    tags: [],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useTasksStore', () => {
  beforeEach(() => {
    useTasksStore.setState({ tasks: [], loading: false, error: null });
    jest.clearAllMocks();
  });

  // ── pending ───────────────────────────────────────────────────────────────

  it('pending devuelve solo tareas no completadas', () => {
    const tasks = [
      makeTask({ id: '1', status: 'todo' }),
      makeTask({ id: '2', status: 'done' }),
      makeTask({ id: '3', status: 'in_progress' }),
    ];
    useTasksStore.setState({ tasks });
    const { result } = renderHook(() => useTasksStore());
    const pending = result.current.pending();
    expect(pending).toHaveLength(2);
    expect(pending.map((t) => t.id)).toEqual(['1', '3']);
  });

  it('pending devuelve lista vacía si todas están done', () => {
    useTasksStore.setState({
      tasks: [
        makeTask({ id: '1', status: 'done' }),
        makeTask({ id: '2', status: 'done' }),
      ],
    });
    const { result } = renderHook(() => useTasksStore());
    expect(result.current.pending()).toHaveLength(0);
  });

  it('pending devuelve todas si ninguna está done', () => {
    useTasksStore.setState({
      tasks: [
        makeTask({ id: '1', status: 'todo' }),
        makeTask({ id: '2', status: 'in_progress' }),
      ],
    });
    const { result } = renderHook(() => useTasksStore());
    expect(result.current.pending()).toHaveLength(2);
  });

  // ── load ──────────────────────────────────────────────────────────────────

  it('load establece las tareas en éxito', async () => {
    const { fetchTasks } = require('../../lib/api');
    const tasks = [makeTask({ id: '1' }), makeTask({ id: '2' })];
    fetchTasks.mockResolvedValueOnce(tasks);

    const { result } = renderHook(() => useTasksStore());
    await act(async () => { await result.current.load('u1'); });

    expect(result.current.tasks).toEqual(tasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('load establece el error en fallo', async () => {
    const { fetchTasks } = require('../../lib/api');
    fetchTasks.mockRejectedValueOnce(new Error('Timeout'));

    const { result } = renderHook(() => useTasksStore());
    await act(async () => { await result.current.load('u1'); });

    expect(result.current.error).toBe('Timeout');
    expect(result.current.loading).toBe(false);
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  it('updateStatus actualiza el estado optimistamente', async () => {
    const { updateTaskStatus } = require('../../lib/api');
    updateTaskStatus.mockResolvedValueOnce(undefined);
    useTasksStore.setState({ tasks: [makeTask({ id: '1', status: 'todo' })] });

    const { result } = renderHook(() => useTasksStore());
    await act(async () => { await result.current.updateStatus('1', 'done'); });

    expect(result.current.tasks[0].status).toBe('done');
  });

  it('updateStatus solo modifica la tarea correcta', async () => {
    const { updateTaskStatus } = require('../../lib/api');
    updateTaskStatus.mockResolvedValueOnce(undefined);
    useTasksStore.setState({
      tasks: [
        makeTask({ id: '1', status: 'todo' }),
        makeTask({ id: '2', status: 'todo' }),
      ],
    });

    const { result } = renderHook(() => useTasksStore());
    await act(async () => { await result.current.updateStatus('1', 'done'); });

    expect(result.current.tasks[0].status).toBe('done');
    expect(result.current.tasks[1].status).toBe('todo');
  });

  // ── update ────────────────────────────────────────────────────────────────

  it('update modifica el título optimistamente', async () => {
    const { updateTask } = require('../../lib/api');
    updateTask.mockResolvedValueOnce(undefined);
    useTasksStore.setState({ tasks: [makeTask({ id: '1', title: 'Viejo' })] });

    const { result } = renderHook(() => useTasksStore());
    await act(async () => {
      await result.current.update('1', { title: 'Nuevo' });
    });

    expect(result.current.tasks[0].title).toBe('Nuevo');
  });

  // ── remove ────────────────────────────────────────────────────────────────

  it('remove elimina la tarea del estado inmediatamente', async () => {
    const { deleteTask } = require('../../lib/api');
    deleteTask.mockResolvedValueOnce(undefined);
    useTasksStore.setState({
      tasks: [makeTask({ id: '1' }), makeTask({ id: '2' })],
    });

    const { result } = renderHook(() => useTasksStore());
    await act(async () => { await result.current.remove('1'); });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe('2');
  });

  it('remove solo elimina la tarea correcta', async () => {
    const { deleteTask } = require('../../lib/api');
    deleteTask.mockResolvedValueOnce(undefined);
    useTasksStore.setState({
      tasks: [
        makeTask({ id: '1', title: 'A' }),
        makeTask({ id: '2', title: 'B' }),
        makeTask({ id: '3', title: 'C' }),
      ],
    });

    const { result } = renderHook(() => useTasksStore());
    await act(async () => { await result.current.remove('2'); });

    expect(result.current.tasks.map((t) => t.id)).toEqual(['1', '3']);
  });
});
