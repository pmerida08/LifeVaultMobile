import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../constants/colors';

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
}

function formatDate(date: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' })} ${date.getFullYear()}  ${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function DatePickerField({ label, value, onChange, placeholder, minimumDate }: DatePickerFieldProps) {
  const colors = useThemeColors();
  const [show, setShow] = useState(false);

  const handleChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(selectedDate);
  };

  const handleClear = () => {
    onChange(undefined);
    setShow(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.background,
            borderColor: show ? colors.primary : colors.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={value ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.triggerText,
            { color: value ? colors.text : colors.textMuted },
          ]}
        >
          {value ? formatDate(value) : (placeholder ?? 'Seleccionar fecha')}
        </Text>
        {value && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          locale="es-ES"
          themeVariant="light"
          accentColor={colors.primary}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => setShow(false)}
          style={[styles.iosDone, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.iosDoneText, { color: colors.white }]}>Listo</Text>
        </TouchableOpacity>
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
