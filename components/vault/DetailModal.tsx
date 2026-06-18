import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDocumentsStore } from '../../store/documents.store';
import { getSignedUrl, extractStoragePath } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CategoryBadge } from './CategoryBadge';
import { useThemeColors } from '../../constants/colors';
import { useToast } from '../../lib/toast';
import { useT } from '../../store/i18n.store';
import type { VaultNote } from '../../types';

type Category = NonNullable<VaultNote['category']>;

const CATEGORIES: { labelKey: string; value: Category }[] = [
  { labelKey: 'vault.catLegal', value: 'legal' },
  { labelKey: 'vault.catHealth', value: 'health' },
  { labelKey: 'vault.catFinance', value: 'finance' },
  { labelKey: 'vault.catPersonal', value: 'personal' },
  { labelKey: 'vault.catOther', value: 'other' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DetailModalProps {
  note: VaultNote | null;
  onClose: () => void;
}

export function DetailModal({ note, onClose }: DetailModalProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { show: showToast } = useToast();
  const { updateNote, deleteNote } = useDocumentsStore();

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (note) {
      setContent(note.content ?? '');
      setCategory((note.category ?? 'other') as Category);
      setDirty(false);
    }
  }, [note]);

  if (!note) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNote(note.id, { content, category });
      setDirty(false);
      showToast('Cambios guardados', 'success');
    } catch {
      showToast('No se pudo guardar. Inténtalo de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    const storagePath = extractStoragePath(note.file_url);
    if (!storagePath) {
      showToast('Este documento no tiene archivo adjunto.', 'info');
      return;
    }
    setDownloading(true);
    try {
      const url = await getSignedUrl(storagePath);
      await Linking.openURL(url);
    } catch {
      showToast('No se pudo obtener el enlace de descarga.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote(note.id, note.file_url);
      showToast('Documento eliminado', 'success');
      onClose();
    } catch {
      showToast('No se pudo eliminar el documento.', 'error');
    }
  };

  return (
    <Modal
      visible={!!note}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
          <View style={styles.headerLeft}>
            <CategoryBadge category={category} />
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Cerrar" style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Título y metadatos */}
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{note.title}</Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDate(note.created_at)}</Text>
              </View>
              {!!note.file_size && (
                <View style={styles.metaItem}>
                  <Ionicons name="document-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatBytes(note.file_size)}</Text>
                </View>
              )}
              {!!note.file_name && (
                <View style={styles.metaItem}>
                  <Ionicons name="attach-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>{note.file_name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Categoría */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Categoría</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => { setCategory(cat.value); setDirty(true); }}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    category === cat.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: category === cat.value }}
                >
                  <Text style={[
                    styles.chipText,
                    { color: category === cat.value ? colors.white : colors.textMuted },
                  ]}>
                    {t(cat.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notas / contenido */}
          <Input
            label="Notas"
            value={content}
            onChangeText={(v) => { setContent(v); setDirty(true); }}
            placeholder="Añade notas o contexto sobre este documento…"
            multiline
            numberOfLines={6}
          />

          {/* Acciones */}
          <View style={styles.actions}>
            {note.file_url && (
              <Button
                label={downloading ? 'Abriendo…' : 'Descargar archivo'}
                onPress={handleDownload}
                loading={downloading}
                variant="secondary"
                icon="download-outline"
              />
            )}
            <Button
              label="Eliminar"
              onPress={handleDelete}
              variant="danger"
              icon="trash-outline"
            />
          </View>
        </ScrollView>

        {/* Footer guardar */}
        {dirty && (
          <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <Button
              label={saving ? 'Guardando…' : 'Guardar cambios'}
              onPress={handleSave}
              loading={saving}
              size="lg"
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  body: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  titleBlock: {
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
