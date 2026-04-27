import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  loadSession: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session?.user) {
      set({
        user: {
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
          avatar_url: session.user.user_metadata?.avatar_url,
          plan: 'free',
        },
        loading: false,
      });
    } else {
      set({ user: null, loading: false });
    }
  },

  signInWithGoogle: async () => {
    // Implementado en LoginScreen con expo-auth-session
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
