import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  initialize: () => Promise<void>;
}

const KEY = '@lifevault_theme';

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem(KEY, theme);
  },

  initialize: async () => {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      set({ theme: stored });
    }
  },
}));
