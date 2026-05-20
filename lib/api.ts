import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import type { VaultNote, Task, CalendarEvent } from '../types';

const BUCKET = 'lifevault-documents';
const N8N_UPLOAD_URL = process.env.EXPO_PUBLIC_N8N_UPLOAD_URL!;

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

export async function updateTask(
  taskId: string,
  payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_date' | 'google_task_id'>>
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
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

export async function createEvent(
  userId: string,
  payload: Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color'>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(
  eventId: string,
  payload: Partial<Pick<CalendarEvent, 'title' | 'description' | 'start_at' | 'end_at' | 'all_day' | 'color' | 'google_event_id'>>
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId);
  if (error) throw error;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

export async function uploadDocument(
  userId: string,
  uri: string,
  filename: string,
  mimeType: string,
  fileSize: number,
  meta: { title: string; category: VaultNote['category']; notes?: string }
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sin sesión activa');

  const ext = filename.split('.').pop() ?? 'bin';
  const path = `${userId}/${Date.now()}.${ext}`;

  // Leer el archivo como base64 — más fiable que uploadAsync en Android (content:// URIs)
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });

  // Decodificar base64 → Uint8Array (atob disponible en Hermes/RN)
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mimeType || 'application/octet-stream' });

  if (uploadError) throw new Error(`Storage: ${uploadError.message}`);

  const actualSize = fileSize > 0 ? fileSize : bytes.byteLength;

  // Insertar vault_note directamente — no dependemos de n8n en móvil
  const { error: insertError } = await supabase.from('vault_notes').insert({
    user_id: userId,
    title: meta.title,
    content: meta.notes ?? '',
    category: meta.category,
    file_url: path,
    file_name: filename,
    file_size: actualSize,
    mime_type: mimeType || 'application/octet-stream',
    tags: [],
    is_pinned: false,
  });

  if (insertError) throw new Error(`DB: ${insertError.message}`);

  // Fire-and-forget a n8n para procesamiento IA (OCR, etc.) — opcional
  const { data: signedData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  fetch(N8N_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url: signedData?.signedUrl ?? '',
      file_path: path,
      user_id: userId,
      title: meta.title,
      category: meta.category,
      file_name: filename,
      mime_type: mimeType || 'application/octet-stream',
      file_size: actualSize,
      tags: [],
      notes: meta.notes ?? null,
    }),
  }).catch(() => {});
}

export async function updateVaultNote(
  noteId: string,
  payload: Partial<Pick<VaultNote, 'content' | 'category' | 'is_pinned' | 'title'>>
): Promise<void> {
  const { error } = await supabase
    .from('vault_notes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', noteId);

  if (error) throw error;
}

export async function deleteVaultNote(noteId: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }
  const { error } = await supabase.from('vault_notes').delete().eq('id', noteId);
  if (error) throw error;
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

function extractStoragePath(fileUrl?: string): string | undefined {
  if (!fileUrl) return undefined;
  if (!fileUrl.startsWith('http')) return fileUrl;
  const parts = fileUrl.split('/lifevault-documents/');
  return parts[1] ?? undefined;
}

export { extractStoragePath };

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

interface StreamCallbacks {
  onToken: (token: string) => void;
  onAttachments?: (attachments: VaultNote[]) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamAIMessage(
  sessionId: string,
  message: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    callbacks.onError(new Error('Sin sesión activa'));
    return;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${supabaseUrl}/functions/v1/ai-assistant`);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Content-Type', 'application/json');

    let processed = 0;
    let lineBuffer = '';
    let isDone = false;

    const processLine = (line: string) => {
      if (!line.startsWith('data: ')) return;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') {
        if (!isDone) { isDone = true; callbacks.onDone(); }
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        const content =
          parsed.content ??
          parsed.token ??
          parsed.choices?.[0]?.delta?.content ??
          parsed.delta?.text ??
          null;
        if (content) callbacks.onToken(content);
        if (parsed.attachments) callbacks.onAttachments?.(parsed.attachments);
        if (parsed.done === true && !isDone) { isDone = true; callbacks.onDone(); }
      } catch {
        if (raw) callbacks.onToken(raw);
      }
    };

    const processChunk = (newText: string) => {
      lineBuffer += newText;
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';
      lines.forEach(processLine);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState >= 3 && xhr.responseText.length > processed) {
        processChunk(xhr.responseText.slice(processed));
        processed = xhr.responseText.length;
      }
      if (xhr.readyState === 4) {
        if (lineBuffer.trim()) processLine(lineBuffer.trim());
        if (!isDone) {
          if (xhr.status === 200) {
            // Respuesta JSON normal (sin SSE)
            try {
              const json = JSON.parse(xhr.responseText);
              const reply = json.reply ?? json.content ?? json.message ?? '';
              if (reply) callbacks.onToken(reply);
            } catch { /* responseText ya procesado como SSE */ }
            callbacks.onDone();
          } else {
            callbacks.onError(new Error(`HTTP ${xhr.status}`));
          }
          isDone = true;
        }
        resolve();
      }
    };

    xhr.onerror = () => {
      if (!isDone) callbacks.onError(new Error('Error de red'));
      resolve();
    };

    xhr.send(JSON.stringify({ session_id: sessionId, message }));
  });
}
