import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../constants/colors';
import { useI18nStore } from '../../store/i18n.store';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_ES = ['L','M','X','J','V','S','D'];
const DAYS_EN = ['M','T','W','T','F','S','S'];

interface Props {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  onClose: () => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first weekday offset
function startOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

type Step = 'date' | 'time';

export function CustomDateTimePicker({ value, onChange, onClose }: Props) {
  const colors = useThemeColors();
  const lang = useI18nStore((s) => s.lang);

  const init = value ?? new Date();
  const [step, setStep] = useState<Step>('date');
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const [selectedDay, setSelectedDay] = useState(init.getDate());
  const [hour, setHour] = useState(init.getHours());
  const [minute, setMinute] = useState(init.getMinutes());

  const months = lang === 'en' ? MONTHS_EN : MONTHS_ES;
  const days   = lang === 'en' ? DAYS_EN   : DAYS_ES;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const offset = startOffset(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const confirmDate = () => {
    setStep('time');
  };

  const confirmTime = () => {
    const d = new Date(viewYear, viewMonth, selectedDay, hour, minute, 0, 0);
    onChange(d);
    onClose();
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      width: 320,
      overflow: 'hidden',
    },
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
    },
    headerLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    headerDate: {
      color: '#fff',
      fontSize: 26,
      fontWeight: '800',
      marginTop: 2,
    },
    body: {
      padding: 16,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    navTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    navBtn: {
      padding: 4,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
    },
    gridRow: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 100,
    },
    dayCellSelected: {
      backgroundColor: colors.primary,
    },
    dayText: {
      fontSize: 14,
      color: colors.text,
    },
    dayTextSelected: {
      color: '#fff',
      fontWeight: '700',
    },
    dayTextEmpty: {
      color: 'transparent',
    },
    timeBody: {
      paddingHorizontal: 24,
      paddingVertical: 24,
      alignItems: 'center',
      gap: 24,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeDisplay: {
      fontSize: 42,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 2,
    },
    timeColon: {
      fontSize: 42,
      fontWeight: '800',
      color: colors.textMuted,
    },
    timeControl: {
      alignItems: 'center',
      gap: 6,
    },
    timeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeValue: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.text,
      width: 64,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    btn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
    },
    btnLabelPrimary: {
      color: '#fff',
    },
  });

  // Build calendar cells
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const headerText = step === 'date'
    ? `${selectedDay} ${months[viewMonth].slice(0, 3)} ${viewYear}`
    : `${pad(hour)}:${pad(minute)}`;

  const cancelLabel = lang === 'en' ? 'Cancel' : 'Cancelar';
  const okLabel     = lang === 'en' ? 'Next' : 'Siguiente';
  const confirmLabel = lang === 'en' ? 'OK' : 'Aceptar';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation()} style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerLabel}>
              {step === 'date'
                ? (lang === 'en' ? 'Select date' : 'Selecciona fecha')
                : (lang === 'en' ? 'Select time' : 'Selecciona hora')}
            </Text>
            <Text style={s.headerDate}>{headerText}</Text>
          </View>

          {step === 'date' ? (
            <View style={s.body}>
              {/* Month navigation */}
              <View style={s.navRow}>
                <TouchableOpacity style={s.navBtn} onPress={prevMonth}>
                  <Ionicons name="chevron-back" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={s.navTitle}>{months[viewMonth]} {viewYear}</Text>
                <TouchableOpacity style={s.navBtn} onPress={nextMonth}>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Day names */}
              <View style={s.weekRow}>
                {days.map((d, i) => <Text key={i} style={s.weekDay}>{d}</Text>)}
              </View>

              {/* Calendar grid */}
              {rows.map((row, ri) => (
                <View key={ri} style={s.gridRow}>
                  {row.map((day, di) => (
                    <TouchableOpacity
                      key={di}
                      style={[s.dayCell, day === selectedDay && viewMonth === init.getMonth() || day === selectedDay ? s.dayCellSelected : null]}
                      onPress={() => day && setSelectedDay(day)}
                      activeOpacity={day ? 0.7 : 1}
                      disabled={!day}
                    >
                      <Text style={[
                        s.dayText,
                        !day && s.dayTextEmpty,
                        day === selectedDay && s.dayTextSelected,
                      ]}>
                        {day ?? ' '}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={s.timeBody}>
              <View style={s.timeRow}>
                <View style={s.timeControl}>
                  <TouchableOpacity style={s.timeBtn} onPress={() => setHour(h => (h + 1) % 24)}>
                    <Ionicons name="chevron-up" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={s.timeValue}>{pad(hour)}</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => setHour(h => (h + 23) % 24)}>
                    <Ionicons name="chevron-down" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={s.timeColon}>:</Text>
                <View style={s.timeControl}>
                  <TouchableOpacity style={s.timeBtn} onPress={() => setMinute(m => (m + 5) % 60)}>
                    <Ionicons name="chevron-up" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={s.timeValue}>{pad(minute)}</Text>
                  <TouchableOpacity style={s.timeBtn} onPress={() => setMinute(m => (m + 55) % 60)}>
                    <Ionicons name="chevron-down" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity style={s.btn} onPress={step === 'date' ? onClose : () => setStep('date')}>
              <Text style={s.btnLabel}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnPrimary]}
              onPress={step === 'date' ? confirmDate : confirmTime}
            >
              <Text style={s.btnLabelPrimary}>{step === 'date' ? okLabel : confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
