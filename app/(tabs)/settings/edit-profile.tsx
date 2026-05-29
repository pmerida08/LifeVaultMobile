import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../../store/auth.store';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { useToast } from '../../../lib/toast';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { show: showToast } = useToast();
  const { user, refreshProfile } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url ?? null);
  const [loading, setLoading] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const pickImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast(t('editProfile.photoPermissionDenied'), 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      showToast(t('editProfile.photoPermissionDenied'), 'error');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast(t('editProfile.nameRequired'), 'error');
      return;
    }
    setLoading(true);
    try {
      let uploadedUrl: string | undefined;

      if (avatarUri && avatarUri !== user?.avatar_url) {
        const ext = (avatarUri.split('.').pop() ?? 'jpg').split('?')[0];
        const path = `${user!.id}/avatar.${ext}`;
        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

        const base64 = await FileSystem.readAsStringAsync(avatarUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const { error: uploadError } = await supabase.storage
          .from('lifevault-documents')
          .upload(path, bytes, { contentType: mimeType, upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('lifevault-documents')
          .getPublicUrl(path);
        uploadedUrl = urlData.publicUrl;
      }

      await supabase.from('users').update({
        name: name.trim(),
        ...(uploadedUrl ? { avatar_url: uploadedUrl } : {}),
      }).eq('id', user!.id);

      await refreshProfile();
      showToast(t('editProfile.saved'), 'success');
    } catch {
      showToast(t('editProfile.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.editProfile')} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.initials, { color: colors.white }]}>{initials}</Text>
                </View>
              )}
              <View style={[styles.cameraOverlay, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhoto, { color: colors.primary }]} onPress={pickImage}>
              {t('editProfile.photo')}
            </Text>
          </Animated.View>

          {/* Name */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('editProfile.name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </Animated.View>

          {/* Email (read-only) */}
          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('editProfile.email')}</Text>
            <View style={[styles.inputReadOnly, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.inputText, { color: colors.textMuted }]}>{user?.email}</Text>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <Button
              label={t('editProfile.save')}
              onPress={handleSave}
              loading={loading}
              style={styles.saveBtn}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  avatarWrapper: { position: 'relative' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 36, fontWeight: '700' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: { fontSize: 14, fontWeight: '600' },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  inputReadOnly: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { fontSize: 15 },
  saveBtn: { marginTop: 8 },
});
