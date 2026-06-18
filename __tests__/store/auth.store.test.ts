import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../../store/auth.store';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const { supabase } = require('../../lib/supabase');
const { GoogleSignin } = require('@react-native-google-signin/google-signin');

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true });
    jest.clearAllMocks();
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  // ── initialize ──────────────────────────────────────────────────────────────

  it('initialize sin sesión deja user en null y loading false', async () => {
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.initialize(); });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('initialize con sesión carga el perfil del usuario', async () => {
    const profile = { id: 'u1', email: 'p@x.com', name: 'Pablo', plan: 'free' };
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
    });
    supabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: profile }) }) }),
    });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.initialize(); });

    expect(result.current.user).toEqual(profile);
    expect(result.current.loading).toBe(false);
  });

  // ── loginWithGoogle ─────────────────────────────────────────────────────────

  it('loginWithGoogle intercambia el idToken con Supabase', async () => {
    GoogleSignin.signIn.mockResolvedValueOnce({ data: { idToken: 'tok-123' } });
    supabase.auth.signInWithIdToken.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.loginWithGoogle(); });

    expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'tok-123',
    });
  });

  it('loginWithGoogle lanza error si Google no devuelve idToken', async () => {
    GoogleSignin.signIn.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await expect(result.current.loginWithGoogle()).rejects.toThrow(
        'No se obtuvo el token de Google'
      );
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────────

  it('logout cierra sesión en Supabase y Google', async () => {
    supabase.auth.signOut.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuthStore());
    await act(async () => { await result.current.logout(); });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(GoogleSignin.signOut).toHaveBeenCalled();
  });
});
