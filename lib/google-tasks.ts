import { getValidAccessToken } from './google-auth';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Google no conectado');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface GoogleTask {
  id?: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  hasDueTime?: boolean;
}

async function getTaskListIds(): Promise<string[]> {
  const res = await fetch(
    'https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=20',
    { headers: await authHeaders() }
  );
  if (!res.ok) throw new Error(`Google Task Lists: ${res.status}`);
  const data = await res.json();
  return ((data.items ?? []) as Array<{ id: string }>).map((l) => l.id);
}

export async function listGoogleTasks(): Promise<GoogleTask[]> {
  const listIds = await getTaskListIds();
  const results = await Promise.all(
    listIds.map(async (listId) => {
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true&maxResults=100`,
        { headers: await authHeaders() }
      );
      if (!res.ok) return [] as GoogleTask[];
      const data = await res.json();
      return (data.items ?? []) as GoogleTask[];
    })
  );
  return results.flat();
}

// Para crear/actualizar/borrar usamos siempre la lista @default (lista principal)
const DEFAULT_BASE = 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks';

export async function createGoogleTask(task: Omit<GoogleTask, 'id'>): Promise<GoogleTask> {
  const res = await fetch(DEFAULT_BASE, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error(`Google Tasks create: ${res.status}`);
  return res.json();
}

export async function updateGoogleTask(
  googleTaskId: string,
  task: Partial<GoogleTask>
): Promise<void> {
  const res = await fetch(`${DEFAULT_BASE}/${googleTaskId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error(`Google Tasks update: ${res.status}`);
}

export async function deleteGoogleTask(googleTaskId: string): Promise<void> {
  const res = await fetch(`${DEFAULT_BASE}/${googleTaskId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Google Tasks delete: ${res.status}`);
}
