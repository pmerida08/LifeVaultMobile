import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../constants/colors';
import { useI18nStore } from '../../store/i18n.store';
import { useThemeStore } from '../../store/theme.store';
import { CustomDateTimePicker } from './CustomDateTimePicker';

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
}

function formatDate(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  const lang = 'es-ES';
  return `${date.getDate()} ${date.toLocaleString(lang, { month: 'short' })} ${date.getFullYear()}  ${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function DatePickerField({ label, value, onChange, placeholder, minimumDate }: DatePickerFieldProps) {
  const colors = useThemeColors();
  const lang = useI18nStore((s) => s.lang);
  const themePreference = useThemeStore((s) => s.theme);
  const locale = lang === 'en' ? 'en-GB' : 'es-ES';
  const themeVariant = themePreference === 'system' ? 'auto' : themePreference;

  const [showPicker, setShowPicker] = useState(false);

  const handleClear = () => onChange(undefined);

  // iOS: onChange inline
  const handleIOSChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) onChange(selectedDate);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.background,
            borderColor: showPicker ? colors.primary : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={value ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.triggerText, { color: value ? colors.text : colors.textMuted }]}>
          {value ? formatDate(value) : (placeholder ?? 'Seleccionar fecha')}
        </Text>
        {value && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Android: picker personalizado con colores y idioma de la app */}
      {Platform.OS === 'android' && showPicker && (
        <CustomDateTimePicker
          value={value}
          onChange={(date) => { onChange(date); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* iOS: picker nativo inline */}
      {Platform.OS === 'ios' && showPicker && (
        <>
          <DateTimePicker
            value={value ?? new Date()}
            mode="datetime"
            display="spinner"
            onChange={handleIOSChange}
            minimumDate={minimumDate}
            locale={locale}
            accentColor={colors.primary}
            themeVariant={themeVariant}
          />
          <TouchableOpacity
            onPress={() => setShowPicker(false)}
            style={[styles.iosDone, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.iosDoneText, { color: colors.white }]}>
              {lang === 'en' ? 'Done' : 'Listo'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  triggerText: { flex: 1, fontSize: 14 },
  iosDone: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  iosDoneText: { fontWeight: '700', fontSize: 15 },
});
