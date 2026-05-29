import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
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
import { SkeletonVault } from '../../components/ui/Skeleton';
import { UploadModal } from '../../components/vault/UploadModal';
import { DetailModal } from '../../components/vault/DetailModal';
import { useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';
import type { VaultNote } from '../../types';

type Category = VaultNote['category'];

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

interface NoteCardProps {
  note: VaultNote;
  index: number;
  onPress: () => void;
  pinnedLabel: string;
}

const NoteCard = React.memo(function NoteCard({ note, index, onPress, pinnedLabel }: NoteCardProps) {
  const colors = useThemeColors();
  const icon = CATEGORY_ICONS[note.category ?? 'other'] ?? 'document-outline';
  const variant = CATEGORY_VARIANTS[note.category ?? 'other'] ?? 'muted';

  const categoryColorMap: Record<string, string> = {
    legal: colors.categoryLegal,
    health: colors.categoryHealth,
    finance: colors.categoryFinance,
    personal: colors.categoryPersonal,
    other: colors.categoryOther,
  };
  const iconColor = categoryColorMap[note.category ?? 'other'] ?? colors.textMuted;

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(index * 50)}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.primarySurface }}
        accessibilityRole="button"
        accessibilityLabel={note.title}
      >
        <Card>
          <View style={styles.noteRow}>
            <View style={[styles.noteIcon, { backgroundColor: `${iconColor}18` }]}>
              <Ionicons name={icon} size={18} color={iconColor} accessibilityElementsHidden />
            </View>
            <View style={styles.noteContent}>
              <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
              <Text style={[styles.noteDate, { color: colors.textMuted }]}>{formatDate(note.created_at)}</Text>
            </View>
            {note.is_pinned && (
              <Ionicons name="bookmark" size={16} color={colors.accent} accessibilityLabel={pinnedLabel} />
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </View>
          <View style={styles.noteMeta}>
            {!!note.category && <Badge label={note.category} variant={variant} />}
            {!!note.file_name && (
              <Text style={[styles.fileName, { color: colors.textMuted }]} numberOfLines={1}>{note.file_name}</Text>
            )}
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FAB({ onPress, label }: { onPress: () => void; label: string }) {
  const colors = useThemeColors();
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
      accessibilityLabel={label}
      style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }, fabStyle]}
    >
      <Ionicons name="add" size={28} color={colors.white} accessibilityElementsHidden />
    </AnimatedPressable>
  );
}

export default function VaultScreen() {
  const colors = useThemeColors();
  const t = useT();
  const { user } = useAuthStore();
  const { loading, setCategory, selectedCategory, filteredNotes, load, notes } = useDocumentsStore();

  const [search, setSearch] = useState('');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<VaultNote | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const CATEGORIES: { label: string; value: Category | null }[] = [
    { label: t('vault.catAll'),      value: null       },
    { label: t('vault.catLegal'),    value: 'legal'    },
    { label: t('vault.catHealth'),   value: 'health'   },
    { label: t('vault.catFinance'),  value: 'finance'  },
    { label: t('vault.catPersonal'), value: 'personal' },
    { label: t('vault.catOther'),    value: 'other'    },
  ];

  useEffect(() => {
    if (user) {
      load(user.id).finally(() => setInitialLoad(false));
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await load(user.id);
    setRefreshing(false);
  }, [user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredList = useMemo(() => filteredNotes(search), [notes, selectedCategory, search]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('vault.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{filteredList.length} {t('vault.documents')}</Text>
      </Animated.View>

      {/* Search */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(60)}
        style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="search-outline" size={17} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('vault.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={t('vault.searchPlaceholder')}
        />
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
                accessibilityLabel={t('vault.filterBy', { label: item.label })}
                accessibilityState={{ selected: active }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.white : colors.textMuted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </Animated.View>

      {/* Notes list */}
      {initialLoad && loading ? (
        <SkeletonVault />
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <Animated.View entering={FadeInUp.duration(400)} style={styles.empty}>
              <Ionicons name="folder-open-outline" size={52} color={colors.border} accessibilityElementsHidden />
              <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>
                {search ? t('vault.noResults') : t('vault.noDocuments')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.border }]}>
                {search
                  ? t('vault.noResultsHint', { search })
                  : t('vault.noDocumentsHint')}
              </Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <NoteCard
              note={item}
              index={index}
              onPress={() => setSelectedNote(item)}
              pinnedLabel={t('vault.pinned')}
            />
          )}
        />
      )}

      <FAB onPress={() => setUploadVisible(true)} label={t('vault.addDocument')} />

      <UploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
      />

      <DetailModal
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  },
  subtitle: {
    fontSize: 14,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    height: 44,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
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
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 100,
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
  },
  noteDate: {
    fontSize: 12,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  fileName: {
    fontSize: 12,
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
  },
  emptySubtitle: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
});
