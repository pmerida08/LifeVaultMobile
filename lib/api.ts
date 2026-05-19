import { supabase } from './supabase';
import type { VaultNote, Task, CalendarEvent } from '../types';

// ─── Vault Notes ───────────────────────────────────────────────────────────────

export async function fetchVaultNotes(userId: string): Promise<VaultNote[]> {
  const { data, error } = await supabase
    .from('vault_notes')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTask(
  userId: string,
  payload: Pick<Task, 'title' | 'description' | 'priority' | 'due_date'>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, user_id: userId, status: 'todo', tags: [] })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(
  taskId: string,
  status: Task['status']
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) throw error;
}

// ─── Events ────────────────────────────────────────────────────────────────────

export async function fetchEvents(userId: string): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_at', now)
    .order('start_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ─── AI Assistant ──────────────────────────────────────────────────────────────

export async function sendAIMessage(
  sessionId: string,
  message: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', {
    body: { session_id: sessionId, message },
  });

  if (error) throw error;
  return data?.reply ?? '';
}
