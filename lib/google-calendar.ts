import { getValidAccessToken } from './google-auth';

const BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Google no conectado');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  eventType?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
}

export async function listGoogleEvents(timeMin: string): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });
  const res = await fetch(`${BASE}?${params}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Google Calendar list: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []) as GoogleCalendarEvent[];
}

export async function createGoogleEvent(
  event: Omit<GoogleCalendarEvent, 'id'>
): Promise<GoogleCalendarEvent> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Google Calendar create: ${res.status}`);
  return res.json();
}

export async function updateGoogleEvent(
  googleEventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<void> {
  const res = await fetch(`${BASE}/${googleEventId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Google Calendar update: ${res.status}`);
}

export async function deleteGoogleEvent(googleEventId: string): Promise<void> {
  const res = await fetch(`${BASE}/${googleEventId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 410) throw new Error(`Google Calendar delete: ${res.status}`);
}
