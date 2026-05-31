import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
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
  // Solo necesario en iOS
  const [showIOS, setShowIOS] = useState(false);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      // Paso 1: seleccionar fecha
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        minimumDate,
        onChange: (_: DateTimePickerEvent, selectedDate?: Date) => {
          if (!selectedDate) return;
          // Paso 2: seleccionar hora con la fecha ya elegida
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: 'time',
            is24Hour: true,
            onChange: (_2: DateTimePickerEvent, selectedTime?: Date) => {
              if (selectedTime) onChange(selectedTime);
            },
          });
        },
      });
    } else {
      setShowIOS(true);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setShowIOS(false);
  };

  // iOS: onChange inline
  const handleIOSChange = (_: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) onChange(selectedDate);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        onPress={openPicker}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.background,
            borderColor: showIOS ? colors.primary : colors.border,
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

      {/* iOS: picker inline */}
      {Platform.OS === 'ios' && showIOS && (
        <>
          <DateTimePicker
            value={value ?? new Date()}
            mode="datetime"
            display="spinner"
            onChange={handleIOSChange}
            minimumDate={minimumDate}
            locale="es-ES"
            accentColor={colors.primary}
          />
          <TouchableOpacity
            onPress={() => setShowIOS(false)}
            style={[styles.iosDone, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.iosDoneText, { color: colors.white }]}>Listo</Text>
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
