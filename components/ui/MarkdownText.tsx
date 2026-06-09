import React from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
  Platform,
} from 'react-native';
import { useThemeColors } from '../../constants/colors';

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      tokens.push({ type: 'bold', value: match[1] });
    } else if (match[2] !== undefined) {
      tokens.push({ type: 'italic', value: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: 'code', value: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}

function InlineParagraph({
  text,
  style,
  inlineCodeStyle,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  inlineCodeStyle?: StyleProp<TextStyle>;
}) {
  const tokens = parseInline(text);
  return (
    <Text style={style}>
      {tokens.map((token, i) => {
        if (token.type === 'bold') {
          return (
            <Text key={i} style={[style, styles.bold]}>
              {token.value}
            </Text>
          );
        }
        if (token.type === 'italic') {
          return (
            <Text key={i} style={[style, styles.italic]}>
              {token.value}
            </Text>
          );
        }
        if (token.type === 'code') {
          return (
            <Text key={i} style={[style, inlineCodeStyle ?? styles.inlineCode]}>
              {token.value}
            </Text>
          );
        }
        return <Text key={i}>{token.value}</Text>;
      })}
    </Text>
  );
}

interface MarkdownTextProps {
  content: string;
  baseStyle?: StyleProp<TextStyle>;
}

export function MarkdownText({ content, baseStyle }: MarkdownTextProps) {
  const colors = useThemeColors();

  const themedDefaultText: TextStyle = { fontSize: 15, lineHeight: 22, color: colors.text };
  const base: StyleProp<TextStyle> = baseStyle ?? themedDefaultText;

  const themedH1: TextStyle = { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4, marginBottom: 2 };
  const themedH2: TextStyle = { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2, marginBottom: 1 };
  const themedH3: TextStyle = { fontSize: 15, fontWeight: '600', color: colors.text };
  const themedListDot: TextStyle = { fontSize: 15, color: colors.primary, lineHeight: 22, minWidth: 18 };
  const themedInlineCode: TextStyle = {
    fontFamily: monoFont,
    backgroundColor: colors.primarySurface,
    color: colors.primary,
    borderRadius: 3,
  };
  const themedCodeBlock: ViewStyle = { backgroundColor: colors.surface === '#FFFFFF' ? '#1E1B2E' : '#12111F', borderRadius: 8, padding: 12 };
  const themedCodeBlockText: TextStyle = { fontFamily: monoFont, fontSize: 13, color: colors.surface === '#FFFFFF' ? '#E0D9FF' : '#D4CEFF', lineHeight: 20 };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <ScrollView
          key={key++}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.codeBlockScroll}
        >
          <View style={themedCodeBlock}>
            <Text style={themedCodeBlockText}>{codeLines.join('\n')}</Text>
          </View>
        </ScrollView>
      );
      i++;
      continue;
    }

    // H1
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      elements.push(<InlineParagraph key={key++} text={h1[1]} style={[base, themedH1]} inlineCodeStyle={themedInlineCode} />);
      i++;
      continue;
    }

    // H2
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      elements.push(<InlineParagraph key={key++} text={h2[1]} style={[base, themedH2]} inlineCodeStyle={themedInlineCode} />);
      i++;
      continue;
    }

    // H3
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      elements.push(<InlineParagraph key={key++} text={h3[1]} style={[base, themedH3]} inlineCodeStyle={themedInlineCode} />);
      i++;
      continue;
    }

    // Bullet
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      elements.push(
        <View key={key++} style={styles.listItem}>
          <Text style={[base, themedListDot]}>•</Text>
          <View style={styles.listItemContent}>
            <InlineParagraph text={bullet[1]} style={base} inlineCodeStyle={themedInlineCode} />
          </View>
        </View>
      );
      i++;
      continue;
    }

    // Numbered list
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      elements.push(
        <View key={key++} style={styles.listItem}>
          <Text style={[base, themedListDot]}>{numbered[1]}.</Text>
          <View style={styles.listItemContent}>
            <InlineParagraph text={numbered[2]} style={base} inlineCodeStyle={themedInlineCode} />
          </View>
        </View>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Normal text
    elements.push(<InlineParagraph key={key++} text={line} style={base} inlineCodeStyle={themedInlineCode} />);
    i++;
  }

  return <View style={styles.container}>{elements}</View>;
}

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

// Fallback inline-code style used when inlineCodeStyle prop is not provided
// (e.g. when MarkdownText is rendered outside a React tree — should not normally happen)
const styles = StyleSheet.create({
  container: { gap: 3 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  inlineCode: {
    fontFamily: monoFont,
    borderRadius: 3,
  },
  codeBlockScroll: { marginVertical: 4 },
  listItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  listItemContent: {
    flex: 1,
  },
});
