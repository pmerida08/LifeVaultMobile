import { create } from 'zustand';
import { streamAIMessage } from '../lib/api';
import type { AIMessage } from '../types';

interface AssistantStore {
  messages: AIMessage[];
  loading: boolean;
  sessionId: string;
  streamingMessageId: string | null;
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
  streamingMessageId: null,

  send: async (content) => {
    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    const assistantMsgId = `msg_${Date.now() + 1}`;
    const assistantPlaceholder: AIMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      loading: true,
      streamingMessageId: assistantMsgId,
    }));

    await streamAIMessage(get().sessionId, content, {
      onToken: (token) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: m.content + token } : m
          ),
        }));
      },
      onAttachments: (attachments) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, attachments } : m
          ),
        }));
      },
      onDone: () => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          ),
          loading: false,
          streamingMessageId: null,
        }));
      },
      onError: () => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: 'Error al conectar con el asistente. Inténtalo de nuevo.', isStreaming: false }
              : m
          ),
          loading: false,
          streamingMessageId: null,
        }));
      },
    });
  },

  clearSession: () =>
    set({ messages: [], sessionId: generateSessionId(), streamingMessageId: null, loading: false }),
}));
