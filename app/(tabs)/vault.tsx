import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { useDocumentsStore } from '../../store/documents.store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Colors } from '../../constants/colors';
import type { VaultNote } from '../../types';

type Category = VaultNote['category'];

const CATEGORIES: { label: string; value: Category | null }[] = [
  { label: 'Todo', value: null },
  { label: 'Legal', value: 'legal' },
  { label: 'Salud', value: 'health' },
  { label: 'Finanzas', value: 'finance' },
  { label: 'Personal', value: 'personal' },
  { label: 'Otros', value: 'other' },
];

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  legal: 'briefcase-outline',
  health: 'heart-outline',
  finance: 'cash-outline',
  personal: 'person-outline',
  other: 'document-outline',
};

const CATEGORY_VARIANTS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'muted'> = {
  legal: 'danger',
  health: 'success',
  finance: 'warning',
  personal: 'primary',
  other: 'muted',
};

const CATEGORY_COLORS: Record<string, string> = {
  legal: Colors.danger,
  health: Colors.success,
  finance: Colors.warning,
  personal: Colors.primary,
  other: Colors.textMuted,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function NoteCard({ note, index }: { note: VaultNote; index: number }) {
  const icon = CATEGORY_ICONS[note.category ?? 'other'] ?? 'document-outline';
  const variant = CATEGORY_VARIANTS[note.category ?? 'other'] ?? 'muted';
  const iconColor = CATEGORY_COLORS[note.category ?? 'other'] ?? Colors.textMuted;

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(index * 60)}>
      <Pressable
        android_ripple={{ color: Colors.primarySurface }}
        accessibilityRole="button"
        accessibilityLabel={note.title}
      >
        <Card style={styles.noteCard}>
          <View style={styles.noteRow}>
            <View style={[styles.noteIcon, { backgroundColor: `${iconColor}18` }]}>
              <Ionicons name={icon} size={18} color={iconColor} accessibilityElementsHidden />
            </View>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
              <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
            </View>
            {note.is_pinned && (
              <Ionicons
                name="bookmark"
                size={16}
                color={Colors.accent}
                accessibilityLabel="Documento fijado"
              />
            )}
          </View>
          <View style={styles.noteMeta}>
            {note.category && <Badge label={note.category} variant={variant} />}
            {note.file_name && (
              <Text style={styles.fileName} numberOfLines={1}>{note.file_name}</Text>
            )}
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FAB({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.92, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
      accessibilityRole="button"
      accessibilityLabel="Añadir documento"
      style={[styles.fab, fabStyle]}
    >
      <Ionicons name="add" size={28} color={Colors.white} accessibilityElementsHidden />
    </AnimatedPressable>
  );
}

export default function VaultScreen() {
  const { user } = useAuthStore();
  const { loading, setCategory, selectedCategory, filteredNotes, load } = useDocumentsStore();

  useEffect(() => {
    if (user) load(user.id);
  }, [user]);

  const notes = filteredNotes();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={styles.title}>Vault</Text>
        <Text style={styles.subtitle}>{notes.length} documentos</Text>
      </Animated.View>

      {/* Category filter */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.value ?? 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = selectedCategory === item.value;
            return (
              <Pressable
                onPress={() => setCategory(item.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${item.label}`}
                accessibilityState={{ selected: active }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </Animated.View>

      {/* Notes list */}
      {loading ? (
        <Spinner fullscreen />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeInUp.duration(400)} style={styles.empty}>
              <Ionicons name="folder-open-outline" size={52} color={Colors.border} accessibilityElementsHidden />
              <Text style={styles.emptyTitle}>Sin documentos</Text>
              <Text style={styles.emptySubtitle}>Toca + para añadir el primero</Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => <NoteCard note={item} index={index} />}
        />
      )}

      <FAB onPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 100,
  },
  noteCard: {
    gap: 10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteContent: {
    flex: 1,
    gap: 2,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.border,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});
