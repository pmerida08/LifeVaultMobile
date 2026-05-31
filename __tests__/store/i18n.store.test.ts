import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18nStore } from '../../store/i18n.store';
import { i18n } from '../../lib/i18n';

describe('useI18nStore', () => {
  beforeEach(() => {
    useI18nStore.setState({ lang: 'es' });
    i18n.locale = 'es';
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
  });

  it('idioma inicial es es', () => {
    const { result } = renderHook(() => useI18nStore((s) => s.lang));
    expect(result.current).toBe('es');
  });

  it('setLang actualiza el estado', async () => {
    const { result } = renderHook(() => useI18nStore());
    await act(async () => { result.current.setLang('en'); });
    expect(result.current.lang).toBe('en');
  });

  it('setLang actualiza el locale de i18n', async () => {
    const { result } = renderHook(() => useI18nStore());
    await act(async () => { result.current.setLang('en'); });
    expect(i18n.locale).toBe('en');
  });

  it('setLang persiste en AsyncStorage', async () => {
    const { result } = renderHook(() => useI18nStore());
    await act(async () => { result.current.setLang('en'); });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@lifevault_lang', 'en');
  });

  it('initialize carga en desde AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('en');
    const { result } = renderHook(() => useI18nStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.lang).toBe('en');
    expect(i18n.locale).toBe('en');
  });

  it('initialize usa es para valores no reconocidos', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('fr');
    const { result } = renderHook(() => useI18nStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.lang).toBe('es');
  });

  it('initialize usa es cuando AsyncStorage devuelve null', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useI18nStore());
    await act(async () => { await result.current.initialize(); });
    expect(result.current.lang).toBe('es');
  });
});
