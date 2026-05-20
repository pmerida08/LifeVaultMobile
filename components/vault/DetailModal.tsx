import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDocumentsStore } from '../../store/documents.store';
import { getSignedUrl, extractStoragePath } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import type { VaultNote } from '../../types';

type Category = NonNullable<VaultNote['category']>;

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Legal', value: 'legal' },
  { label: 'Salud', value: 'health' },
  { label: 'Finanzas', value: 'finance' },
  { label: 'Personal', value: 'personal' },
  { label: 'Otros', value: 'other' },
];

const CATEGORY_VARIANTS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'muted'> = {
  legal: 'danger',
  health: 'success',
  finance: 'warning',
  personal: 'primary',
  other: 'muted',
};

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
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    const storagePath = extractStoragePath(note.file_url);
    if (!storagePath) {
      Alert.alert('Sin archivo', 'Este documento no tiene archivo adjunto.');
      return;
    }
    setDownloading(true);
    try {
      const url = await getSignedUrl(storagePath);
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'No se pudo obtener el enlace de descarga.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar documento',
      `¿Seguro que quieres eliminar "${note.title}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id, note.file_url);
              onClose();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el documento.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={!!note}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {note.category && (
              <Badge label={note.category} variant={CATEGORY_VARIANTS[note.category] ?? 'muted'} />
            )}
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Cerrar" style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Título y metadatos */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{note.title}</Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{formatDate(note.created_at)}</Text>
              </View>
              {!!note.file_size && (
                <View style={styles.metaItem}>
                  <Ionicons name="document-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{formatBytes(note.file_size)}</Text>
                </View>
              )}
              {!!note.file_name && (
                <View style={styles.metaItem}>
                  <Ionicons name="attach-outline" size={13} color={Colors.textMuted} />
                  <Text style={styles.metaText} numberOfLines={1}>{note.file_name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categoría</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => { setCategory(cat.value); setDirty(true); }}
                  style={[styles.chip, category === cat.value && styles.chipActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: category === cat.value }}
                >
                  <Text style={[styles.chipText, category === cat.value && styles.chipTextActive]}>
                    {cat.label}
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
          <View style={styles.footer}>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
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
    color: Colors.text,
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
    color: Colors.textMuted,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.white,
  },
  actions: {
    gap: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
