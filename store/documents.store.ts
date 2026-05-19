import { create } from 'zustand';
import { fetchVaultNotes } from '../lib/api';
import type { VaultNote } from '../types';

interface DocumentsStore {
  notes: VaultNote[];
  loading: boolean;
  error: string | null;
  selectedCategory: VaultNote['category'] | null;
  load: (userId: string) => Promise<void>;
  setCategory: (category: VaultNote['category'] | null) => void;
  filteredNotes: () => VaultNote[];
}

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  selectedCategory: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const notes = await fetchVaultNotes(userId);
      set({ notes, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  setCategory: (category) => set({ selectedCategory: category }),

  filteredNotes: () => {
    const { notes, selectedCategory } = get();
    if (!selectedCategory) return notes;
    return notes.filter((n) => n.category === selectedCategory);
  },
}));
