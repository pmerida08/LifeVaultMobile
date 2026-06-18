import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { useDocumentsStore } from '../../store/documents.store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { show: showToast } = useToast();
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
      FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => {});
      showToast('Documento subido', 'success');
      handleClose();
    } catch (e: any) {
      FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => {});
      showToast(e?.message ?? 'Error al subir el documento', 'error');
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Añadir documento</Text>
          <Pressable onPress={handleClose} accessibilityLabel="Cerrar" style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* File picker */}
          <Pressable
            onPress={handlePickFile}
            style={[
              styles.filePicker,
              { borderColor: colors.border, backgroundColor: colors.surface },
              file && { borderStyle: 'solid', borderColor: colors.primary, backgroundColor: colors.primarySurface },
            ]}
          >
            {file ? (
              <View style={styles.fileInfo}>
                <Ionicons name="document-attach-outline" size={24} color={colors.primary} />
                <View style={styles.fileText}>
                  <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                  <Text style={[styles.fileSize, { color: colors.textMuted }]}>{formatBytes(file.size ?? 0)}</Text>
                </View>
                <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
              </View>
            ) : (
              <View style={styles.fileEmpty}>
                <Ionicons name="cloud-upload-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.fileEmptyText, { color: colors.textMuted }]}>Seleccionar archivo</Text>
                <Text style={[styles.fileEmptyHint, { color: colors.border }]}>PDF, imagen, Word, Excel…</Text>
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
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Categoría</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
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
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  body: {
    padding: 20,
    gap: 20,
  },
  filePicker: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  fileEmpty: {
    alignItems: 'center',
    gap: 6,
  },
  fileEmptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  fileEmptyHint: {
    fontSize: 12,
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
  },
  fileSize: {
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
