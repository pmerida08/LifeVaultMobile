import { create } from 'zustand';
import { fetchVaultNotes, uploadDocument, updateVaultNote, deleteVaultNote, extractStoragePath } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import type { VaultNote } from '../types';

interface UploadMeta {
  title: string;
  category: VaultNote['category'];
  notes?: string;
}

interface DocumentsStore {
  notes: VaultNote[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  selectedCategory: VaultNote['category'] | null;
  load: (userId: string) => Promise<void>;
  upload: (userId: string, uri: string, filename: string, mimeType: string, fileSize: number, meta: UploadMeta) => Promise<void>;
  updateNote: (noteId: string, payload: Partial<Pick<VaultNote, 'content' | 'category' | 'is_pinned' | 'title'>>) => Promise<void>;
  deleteNote: (noteId: string, fileUrl?: string) => Promise<void>;
  setCategory: (category: VaultNote['category'] | null) => void;
  filteredNotes: (query?: string) => VaultNote[];
}

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  notes: [],
  loading: false,
  uploading: false,
  error: null,
  selectedCategory: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const notes = await fetchVaultNotes(userId);
      set({ notes, loading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), loading: false });
    }
  },

  upload: async (userId, uri, filename, mimeType, fileSize, meta) => {
    set({ uploading: true, error: null });
    try {
      await uploadDocument(userId, uri, filename, mimeType, fileSize, meta);

      // El INSERT lo hacemos nosotros en uploadDocument — refrescar directamente
      const notes = await fetchVaultNotes(userId);
      set({ notes, uploading: false });
    } catch (e) {
      set({ error: getErrorMessage(e), uploading: false });
      throw e;
    }
  },

  updateNote: async (noteId, payload) => {
    try {
      await updateVaultNote(noteId, payload);
      set((state) => ({
        notes: state.notes.map((n) => n.id === noteId ? { ...n, ...payload } : n),
      }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  deleteNote: async (noteId, fileUrl) => {
    try {
      const storagePath = extractStoragePath(fileUrl);
      await deleteVaultNote(noteId, storagePath);
      set((state) => ({ notes: state.notes.filter((n) => n.id !== noteId) }));
    } catch (e) {
      set({ error: getErrorMessage(e) });
      throw e;
    }
  },

  setCategory: (category) => set({ selectedCategory: category }),

  filteredNotes: (query = '') => {
    const { notes, selectedCategory } = get();
    let result = notes;
    if (selectedCategory) result = result.filter((n) => n.category === selectedCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q));
    }
    return result;
  },
}));
