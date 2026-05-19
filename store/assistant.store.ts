import { create } from 'zustand';
import { sendAIMessage } from '../lib/api';
import type { AIMessage } from '../types';

interface AssistantStore {
  messages: AIMessage[];
  loading: boolean;
  sessionId: string;
  send: (content: string) => Promise<void>;
  clearSession: () => void;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  messages: [],
  loading: false,
  sessionId: generateSessionId(),

  send: async (content) => {
    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      loading: true,
    }));

    try {
      const reply = await sendAIMessage(get().sessionId, content);
      const assistantMessage: AIMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        loading: false,
      }));
    } catch (e: any) {
      const errorMessage: AIMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Error connecting to AI assistant. Please try again.',
        created_at: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        loading: false,
      }));
    }
  },

  clearSession: () =>
    set({ messages: [], sessionId: generateSessionId() }),
}));
