import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAssistantStore } from '../../store/assistant.store';
import { MarkdownText } from '../../components/ui/MarkdownText';
import { TypingDots } from '../../components/ui/TypingDots';
import { useThemeColors } from '../../constants/colors';
import { useT } from '../../store/i18n.store';
import type { AIMessage, VaultNote } from '../../types';

// ─── Attachment Card ──────────────────────────────────────────────────────────

const AttachmentCard = React.memo(function AttachmentCard({ note }: { note: VaultNote }) {
  const colors = useThemeColors();
  const isImage = note.mime_type?.startsWith('image/');
  const icon = isImage ? 'image-outline' : 'document-text-outline';

  const categoryColors: Record<string, string> = {
    legal: colors.categoryLegal,
    health: colors.categoryHealth,
    finance: colors.categoryFinance,
    personal: colors.categoryPersonal,
    other: colors.categoryOther,
  };
  const categoryColor = categoryColors[note.category ?? 'other'] ?? colors.categoryOther;
  const sizeKb = note.file_size ? Math.round(note.file_size / 1024) : null;

  return (
    <View style={[styles.attachmentCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.attachmentIcon, { backgroundColor: categoryColor + '22' }]}>
        <Ionicons name={icon as any} size={18} color={categoryColor} />
      </View>
      <View style={styles.attachmentInfo}>
        <Text style={[styles.attachmentTitle, { color: colors.text }]} numberOfLines={1}>
          {note.title}
        </Text>
        <Text style={[styles.attachmentMeta, { color: colors.textMuted }]}>
          {note.category ?? 'other'}
          {sizeKb ? ` · ${sizeKb} KB` : ''}
        </Text>
      </View>
    </View>
  );
});

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = React.memo(function MessageBubble({ message }: { message: AIMessage }) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const isEmpty = message.content === '' && message.isStreaming;

  return (
    <View
      style={[
        styles.bubbleWrapper,
        isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAssistant,
      ]}
    >
      {!isUser && (
        <View style={[styles.avatarIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={14} color={colors.white} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : {
                backgroundColor: colors.surface,
                borderBottomLeftRadius: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 1,
              },
          isEmpty && styles.bubbleTyping,
        ]}
      >
        {isEmpty ? (
          <TypingDots />
        ) : isUser ? (
          <Text style={[styles.bubbleTextUser, { color: colors.white }]}>{message.content}</Text>
        ) : (
          <MarkdownText
            content={message.content}
            baseStyle={[styles.bubbleTextAssistant, { color: colors.text }]}
          />
        )}

        {message.attachments && message.attachments.length > 0 && (
          <View style={styles.attachmentList}>
            {message.attachments.map((note) => (
              <AttachmentCard key={note.id} note={note} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AssistantScreen() {
  const colors = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { messages, loading, send, clearSession } = useAssistantStore();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    await send(trimmed);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={20} color={colors.white} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('assistant.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('assistant.subtitle')}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={clearSession}
          style={styles.newSessionBtn}
          activeOpacity={0.7}
          disabled={loading}
          accessibilityLabel={t('assistant.newSession')}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={loading ? colors.textMuted : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('assistant.emptyTitle')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t('assistant.emptySubtitle')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            renderItem={({ item }) => <MessageBubble message={item} />}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={input}
            onChangeText={setInput}
            placeholder={t('assistant.messagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || loading}
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!input.trim() || loading) && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  newSessionBtn: {
    padding: 6,
  },
  keyboardAvoid: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageList: {
    padding: 16,
    gap: 12,
    paddingBottom: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  avatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTyping: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bubbleTextUser: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextAssistant: {
    fontSize: 15,
    lineHeight: 22,
  },
  attachmentList: {
    marginTop: 8,
    gap: 6,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  attachmentIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
