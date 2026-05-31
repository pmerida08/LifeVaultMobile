import { renderHook, act } from '@testing-library/react-native';
import { useDocumentsStore } from '../../store/documents.store';
import type { VaultNote } from '../../types';

jest.mock('../../lib/api', () => ({
  fetchVaultNotes: jest.fn(),
  uploadDocument: jest.fn(),
  updateVaultNote: jest.fn(),
  deleteVaultNote: jest.fn(),
  extractStoragePath: jest.fn((url?: string) => url ?? null),
}));

function makeNote(overrides: Partial<VaultNote> = {}): VaultNote {
  return {
    id: '1',
    user_id: 'u1',
    title: 'Documento de prueba',
    content: '',
    tags: [],
    is_pinned: false,
    category: 'personal',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useDocumentsStore', () => {
  beforeEach(() => {
    useDocumentsStore.setState({
      notes: [],
      loading: false,
      uploading: false,
      error: null,
      selectedCategory: null,
    });
    jest.clearAllMocks();
  });

  // ── Selectores puros ──────────────────────────────────────────────────────

  it('filteredNotes devuelve todos los documentos sin filtros', () => {
    const notes = [makeNote({ id: '1' }), makeNote({ id: '2' })];
    useDocumentsStore.setState({ notes });
    const { result } = renderHook(() => useDocumentsStore());
    expect(result.current.filteredNotes()).toHaveLength(2);
  });

  it('filteredNotes filtra por categoría', () => {
    const notes = [
      makeNote({ id: '1', category: 'legal' }),
      makeNote({ id: '2', category: 'health' }),
      makeNote({ id: '3', category: 'legal' }),
    ];
    useDocumentsStore.setState({ notes, selectedCategory: 'legal' });
    const { result } = renderHook(() => useDocumentsStore());
    const filtered = result.current.filteredNotes();
    expect(filtered).toHaveLength(2);
    expect(filtered.every((n) => n.category === 'legal')).toBe(true);
  });

  it('filteredNotes filtra por query de búsqueda', () => {
    const notes = [
      makeNote({ id: '1', title: 'Contrato de alquiler' }),
      makeNote({ id: '2', title: 'Nómina enero 2025' }),
    ];
    useDocumentsStore.setState({ notes });
    const { result } = renderHook(() => useDocumentsStore());
    expect(result.current.filteredNotes('alquiler')).toHaveLength(1);
    expect(result.current.filteredNotes('nómina')).toHaveLength(1);
    expect(result.current.filteredNotes('2025')).toHaveLength(1);
  });

  it('filteredNotes combina categoría y query', () => {
    const notes = [
      makeNote({ id: '1', title: 'Contrato notarial', category: 'legal' }),
      makeNote({ id: '2', title: 'Factura médica', category: 'health' }),
      makeNote({ id: '3', title: 'Contrato laboral', category: 'other' }),
    ];
    useDocumentsStore.setState({ notes, selectedCategory: 'legal' });
    const { result } = renderHook(() => useDocumentsStore());
    expect(result.current.filteredNotes('contrato')).toHaveLength(1);
    expect(result.current.filteredNotes('contrato')[0].id).toBe('1');
  });

  it('filteredNotes ignora mayúsculas en la búsqueda', () => {
    const notes = [makeNote({ id: '1', title: 'Pasaporte Español' })];
    useDocumentsStore.setState({ notes });
    const { result } = renderHook(() => useDocumentsStore());
    expect(result.current.filteredNotes('PASAPORTE')).toHaveLength(1);
    expect(result.current.filteredNotes('español')).toHaveLength(1);
  });

  it('filteredNotes devuelve vacío si la query no coincide', () => {
    const notes = [makeNote({ id: '1', title: 'Contrato' })];
    useDocumentsStore.setState({ notes });
    const { result } = renderHook(() => useDocumentsStore());
    expect(result.current.filteredNotes('inexistente')).toHaveLength(0);
  });

  // ── setCategory ───────────────────────────────────────────────────────────

  it('setCategory actualiza selectedCategory', () => {
    const { result } = renderHook(() => useDocumentsStore());
    act(() => { result.current.setCategory('health'); });
    expect(result.current.selectedCategory).toBe('health');
  });

  it('setCategory acepta null para limpiar el filtro', () => {
    useDocumentsStore.setState({ selectedCategory: 'legal' });
    const { result } = renderHook(() => useDocumentsStore());
    act(() => { result.current.setCategory(null); });
    expect(result.current.selectedCategory).toBeNull();
  });

  // ── load ──────────────────────────────────────────────────────────────────

  it('load establece los documentos en éxito', async () => {
    const { fetchVaultNotes } = require('../../lib/api');
    const notes = [makeNote({ id: '1' }), makeNote({ id: '2' })];
    fetchVaultNotes.mockResolvedValueOnce(notes);

    const { result } = renderHook(() => useDocumentsStore());
    await act(async () => { await result.current.load('u1'); });

    expect(result.current.notes).toEqual(notes);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('load establece el error en fallo', async () => {
    const { fetchVaultNotes } = require('../../lib/api');
    fetchVaultNotes.mockRejectedValueOnce(new Error('Error de red'));

    const { result } = renderHook(() => useDocumentsStore());
    await act(async () => { await result.current.load('u1'); });

    expect(result.current.error).toBe('Error de red');
    expect(result.current.loading).toBe(false);
    expect(result.current.notes).toEqual([]);
  });

  // ── updateNote ────────────────────────────────────────────────────────────

  it('updateNote actualiza el título en el estado local', async () => {
    const { updateVaultNote } = require('../../lib/api');
    updateVaultNote.mockResolvedValueOnce(undefined);
    useDocumentsStore.setState({ notes: [makeNote({ id: '1', title: 'Título viejo' })] });

    const { result } = renderHook(() => useDocumentsStore());
    await act(async () => {
      await result.current.updateNote('1', { title: 'Título nuevo' });
    });

    expect(result.current.notes[0].title).toBe('Título nuevo');
  });

  it('updateNote solo modifica el documento correcto', async () => {
    const { updateVaultNote } = require('../../lib/api');
    updateVaultNote.mockResolvedValueOnce(undefined);
    useDocumentsStore.setState({
      notes: [
        makeNote({ id: '1', title: 'A' }),
        makeNote({ id: '2', title: 'B' }),
      ],
    });

    const { result } = renderHook(() => useDocumentsStore());
    await act(async () => {
      await result.current.updateNote('1', { title: 'A actualizado' });
    });

    expect(result.current.notes[0].title).toBe('A actualizado');
    expect(result.current.notes[1].title).toBe('B');
  });

  // ── deleteNote ────────────────────────────────────────────────────────────

  it('deleteNote elimina el documento del estado', async () => {
    const { deleteVaultNote } = require('../../lib/api');
    deleteVaultNote.mockResolvedValueOnce(undefined);
    useDocumentsStore.setState({
      notes: [makeNote({ id: '1' }), makeNote({ id: '2' })],
    });

    const { result } = renderHook(() => useDocumentsStore());
    await act(async () => { await result.current.deleteNote('1'); });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].id).toBe('2');
  });
});
