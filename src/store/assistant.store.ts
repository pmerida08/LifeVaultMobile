import { create } from 'zustand';
import { queryAssistant } from '../lib/api';
import type { AIMessage } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface AssistantState {
  messages: AIMessage[];
  sessionId: string;
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearSession: () => void;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [],
  sessionId: uuidv4(),
  loading: false,
  error: null,

  sendMessage: async (text: string) => {
    const userMsg: AIMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    set((s) => ({ messages: [...s.messages, userMsg], loading: true, error: null }));

    try {
      const response = await queryAssistant(text, get().sessionId);
      const assistantMsg: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }));
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Error desconocido' });
    }
  },

  clearSession: () =>
    set({ messages: [], sessionId: uuidv4(), error: null }),
}));
