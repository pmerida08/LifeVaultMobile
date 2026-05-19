export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  plan: 'free' | 'premium' | 'family'
}

export interface VaultNote {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  file_url?: string
  file_name?: string
  file_size?: number
  category?: 'legal' | 'health' | 'finance' | 'personal' | 'other'
  mime_type?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  start_at: string
  end_at?: string
  all_day: boolean
  color?: string
  created_at: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
