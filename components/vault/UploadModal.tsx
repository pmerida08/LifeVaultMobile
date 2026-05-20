import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { useDocumentsStore } from '../../store/documents.store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadModal({ visible, onClose }: UploadModalProps) {
  const { user } = useAuthStore();
  const { upload, uploading } = useDocumentsStore();

  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [notes, setNotes] = useState('');

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];

    // Copiar a documentDirectory — más persistente que la caché del picker
    const stablePath = `${FileSystem.documentDirectory}lv_upload_${Date.now()}_${asset.name}`;
    await FileSystem.copyAsync({ from: asset.uri, to: stablePath });

    setFile({ ...asset, uri: stablePath });
    if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || !user) return;

    try {
      await upload(
        user.id,
        file.uri,
        file.name,
        file.mimeType ?? 'application/octet-stream',
        file.size ?? 0,
        { title: title.trim(), category, notes: notes.trim() || undefined }
      );
      // Limpiar archivo temporal tras upload exitoso
      FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => {});
      handleClose();
    } catch (e: any) {
      // Limpiar también en caso de error
      FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => {});
      Alert.alert('Error al subir', e?.message ?? 'Error desconocido');
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setCategory('other');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Añadir documento</Text>
          <Pressable onPress={handleClose} accessibilityLabel="Cerrar" style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* File picker */}
          <Pressable onPress={handlePickFile} style={[styles.filePicker, file && styles.filePickerFilled]}>
            {file ? (
              <View style={styles.fileInfo}>
                <Ionicons name="document-attach-outline" size={24} color={Colors.primary} />
                <View style={styles.fileText}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileSize}>{formatBytes(file.size ?? 0)}</Text>
                </View>
                <Ionicons name="pencil-outline" size={18} color={Colors.textMuted} />
              </View>
            ) : (
              <View style={styles.fileEmpty}>
                <Ionicons name="cloud-upload-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.fileEmptyText}>Seleccionar archivo</Text>
                <Text style={styles.fileEmptyHint}>PDF, imagen, Word, Excel…</Text>
              </View>
            )}
          </Pressable>

          {/* Título */}
          <Input
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Nombre del documento"
          />

          {/* Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Categoría</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
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

          {/* Notas */}
          <Input
            label="Notas (opcional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Añade contexto sobre este documento…"
            multiline
            numberOfLines={3}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            label={uploading ? 'Subiendo…' : 'Subir documento'}
            onPress={handleUpload}
            loading={uploading}
            disabled={!file || !title.trim()}
            size="lg"
          />
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  body: {
    padding: 20,
    gap: 20,
  },
  filePicker: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    minHeight: 100,
  },
  filePickerFilled: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  fileEmpty: {
    alignItems: 'center',
    gap: 6,
  },
  fileEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  fileEmptyHint: {
    fontSize: 12,
    color: Colors.border,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  fileText: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  fileSize: {
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
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
