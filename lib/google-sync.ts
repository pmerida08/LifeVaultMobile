import { supabase } from './supabase';
import { isConnected } from './google-auth';
import { listGoogleTasks } from './google-tasks';
import { listGoogleEvents } from './google-calendar';

function googleStatusToLocal(gStatus: string): 'todo' | 'done' {
  return gStatus === 'completed' ? 'done' : 'todo';
}

export interface SyncResult {
  tasksFetched: number;
  tasksUpserted: number;
  eventsFetched: number;
  eventsUpserted: number;
  errors: string[];
}

export async function syncTasksFromGoogle(
  userId: string,
  result: SyncResult
): Promise<void> {
  if (!(await isConnected())) return;

  const gTasks = await listGoogleTasks();
  result.tasksFetched = gTasks.length;

  for (const gt of gTasks) {
    if (!gt.id || !gt.title) continue;

    const { data: existing, error: selectErr } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('google_task_id', gt.id)
      .maybeSingle();

    if (selectErr) {
      result.errors.push(`tasks select: ${selectErr.message}`);
      continue;
    }

    if (existing) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: gt.title,
          description: gt.notes ?? null,
          status: googleStatusToLocal(gt.status),
          due_date: gt.due ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) result.errors.push(`tasks update: ${error.message}`);
      else result.tasksUpserted++;
    } else {
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: gt.title,
        description: gt.notes ?? null,
        status: googleStatusToLocal(gt.status),
        priority: 'medium',
        due_date: gt.due ?? null,
        google_task_id: gt.id,
        tags: [],
      });
      if (error) result.errors.push(`tasks insert: ${error.message}`);
      else result.tasksUpserted++;
    }
  }
}

export async function syncEventsFromGoogle(
  userId: string,
  result: SyncResult
): Promise<void> {
  if (!(await isConnected())) return;

  const now = new Date().toISOString();
  const gEvents = await listGoogleEvents(now);
  result.eventsFetched = gEvents.length;

  for (const ge of gEvents) {
    if (!ge.id || !ge.summary) continue;
    if (ge.eventType === 'birthday') continue;

    const { data: existing, error: selectErr } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', userId)
      .eq('google_event_id', ge.id)
      .maybeSingle();

    if (selectErr) {
      result.errors.push(`events select: ${selectErr.message}`);
      continue;
    }

    const isAllDay = !ge.start.dateTime;
    const startAt = ge.start.dateTime ?? `${ge.start.date}T00:00:00Z`;
    const endAt = ge.end.dateTime ?? (ge.end.date ? `${ge.end.date}T23:59:59Z` : null);

    if (existing) {
      const { error } = await supabase
        .from('events')
        .update({
          title: ge.summary,
          description: ge.description ?? null,
          start_at: startAt,
          end_at: endAt,
          all_day: isAllDay,
        })
        .eq('id', existing.id);
      if (error) result.errors.push(`events update: ${error.message}`);
      else result.eventsUpserted++;
    } else {
      const { error } = await supabase.from('events').insert({
        user_id: userId,
        title: ge.summary,
        description: ge.description ?? null,
        start_at: startAt,
        end_at: endAt,
        all_day: isAllDay,
        google_event_id: ge.id,
      });
      if (error) result.errors.push(`events insert: ${error.message}`);
      else result.eventsUpserted++;
    }
  }
}

export async function importAllFromGoogle(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    tasksFetched: 0,
    tasksUpserted: 0,
    eventsFetched: 0,
    eventsUpserted: 0,
    errors: [],
  };
  await syncTasksFromGoogle(userId, result);
  await syncEventsFromGoogle(userId, result);
  return result;
}
