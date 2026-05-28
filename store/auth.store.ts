import { create } from 'zustand';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: [
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/calendar',
  ],
});

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  cleanup: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

async function upsertProfile(userId: string, email: string, name: string, avatarUrl?: string) {
  await supabase.from('users').upsert({
    id: userId,
    email,
    name,
    avatar_url: avatarUrl ?? null,
    plan: 'free',
  }, { onConflict: 'id' });
}

let _authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    // Limpia cualquier suscripción previa antes de crear una nueva
    _authSubscription?.unsubscribe();
    _authSubscription = null;

    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ user: profile ?? null, loading: false });
    } else {
      set({ user: null, loading: false });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        await upsertProfile(
          u.id,
          u.email!,
          u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email!,
          u.user_metadata?.avatar_url,
        );
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', u.id)
          .single();
        set({ user: profile ?? null });
      } else {
        set({ user: null });
      }
    });
    _authSubscription = subscription;
  },

  cleanup: () => {
    _authSubscription?.unsubscribe();
    _authSubscription = null;
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  register: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await upsertProfile(data.user.id, email, name);
    }
  },

  loginWithGoogle: async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();

    const idToken = signInResult.data?.idToken;
    if (!idToken) throw new Error('No se obtuvo el token de Google');

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    try { await GoogleSignin.signOut(); } catch (_) {}
    // user: null lo gestiona onAuthStateChange — no duplicar el set
  },
}));
