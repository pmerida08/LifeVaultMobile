import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '../../../constants/colors';
import { useT } from '../../../store/i18n.store';
import { useToast } from '../../../lib/toast';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { SettingsHeader } from '../../../components/ui/SettingsHeader';

export default function ChangePasswordScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { show: showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (newPassword.length < 6) {
      showToast(t('changePassword.tooShort'), 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t('changePassword.mismatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast(t('changePassword.success'), 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast(t('changePassword.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <SettingsHeader title={t('settings.changePassword')} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              {t('changePassword.info')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('changePassword.newPassword')}</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                style={[styles.input, { color: colors.text }]}
                placeholderTextColor={colors.textMuted}
                placeholder="••••••••"
              />
              <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('changePassword.confirmPassword')}</Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                style={[styles.input, { color: colors.text }]}
                placeholderTextColor={colors.textMuted}
                placeholder="••••••••"
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <Button
              label={t('changePassword.save')}
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(87,82,223,0.08)',
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  saveBtn: { marginTop: 8 },
});
