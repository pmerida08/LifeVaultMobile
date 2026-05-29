import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '../lib/i18n';

export type LangPreference = 'es' | 'en';

interface I18nStore {
  lang: LangPreference;
  setLang: (lang: LangPreference) => void;
  initialize: () => Promise<void>;
}

const KEY = '@lifevault_lang';

export const useI18nStore = create<I18nStore>((set) => ({
  lang: 'es',

  setLang: (lang) => {
    i18n.locale = lang;
    AsyncStorage.setItem(KEY, lang);
    set({ lang });
  },

  initialize: async () => {
    const stored = await AsyncStorage.getItem(KEY);
    const lang: LangPreference = stored === 'en' ? 'en' : 'es';
    i18n.locale = lang;
    set({ lang });
  },
}));

export function useT() {
  useI18nStore((s) => s.lang);
  return (key: string, options?: object): string => i18n.t(key, options);
}
