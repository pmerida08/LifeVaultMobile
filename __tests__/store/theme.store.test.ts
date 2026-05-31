import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../store/theme.store';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system' });
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
  });

  it('el tema inicial es system', () => {
    const { result } = renderHook(() => useThemeStore((s) => s.theme));
    expect(result.current).toBe('system');
  });

  it('setTheme actualiza el estado', async () => {
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { result.current.setTheme('dark'); });
    expect(result.current.theme).toBe('dark');
  });

  it('setTheme persiste en AsyncStorage', async () => {
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { result.current.setTheme('light'); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@lifevault_theme', 'light');
  });

  it('initialize carga el tema almacenado', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark');
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.theme).toBe('dark');
  });

  it('initialize acepta light y system', async () => {
    for (const theme of ['light', 'system'] as const) {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(theme);
      const { result } = renderHook(() => useThemeStore());
      await act(async () => {
        useThemeStore.setState({ theme: 'dark' });
        await result.current.initialize();
      });
      expect(result.current.theme).toBe(theme);
    }
  });

  it('initialize ignora valores inválidos', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('purple');
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.theme).toBe('system');
  });

  it('initialize no cambia nada si AsyncStorage es null', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useThemeStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.theme).toBe('system');
  });
});
