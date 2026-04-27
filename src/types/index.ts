export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  plan: 'free' | 'premium' | 'family';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIAttachment {
  type: 'document' | 'task' | 'event';
  id: string;
  title: string;
}

export interface AIAction {
  type: 'create_task' | 'create_event' | 'navigate';
  payload: Record<string, unknown>;
}

export interface AIQueryResponse {
  message: string;
  actions: AIAction[];
  attachments: AIAttachment[];
}
