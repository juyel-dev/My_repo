import { Feather } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  Alert, Platform, Pressable, Share, StyleSheet, Text, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import type { Message } from '@/types';
import { MONO_FONT } from '@/constants/colors';

interface Props {
  message: Message;
  index: number;
  onDelete?: (id: string) => void;
  onRetry?: () => void;
}

function parseMarkdown(text: string) {
  const segments: { type: 'text' | 'code' | 'bold' | 'italic'; content: string }[] = [];
  const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/g;
  let last = 0;
  let match;
  codeBlockRegex.lastIndex = 0;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', content: text.slice(last, match.index) });
    }
    const raw = match[0];
    const content = raw.startsWith('```')
      ? raw.slice(raw.indexOf('\n') + 1, raw.lastIndexOf('```')).trim()
      : raw.slice(1, -1);
    segments.push({ type: 'code', content });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: 'text', content: text.slice(last) });
  }
  return segments;
}

export function MessageBubble({ message, index, onDelete, onRetry }: Props) {
  const colors = useColors();
  const haptics = useHaptics();
  const isUser = message.role === 'user';
  const isError = message.error;

  const handleCopy = useCallback(async () => {
    haptics.light();
    try {
      if (Platform.OS !== 'web') {
        await Share.share({ message: message.content });
      } else {
        await navigator.clipboard?.writeText(message.content);
      }
    } catch { /* ignore */ }
  }, [message.content, haptics]);

  const handleDelete = useCallback(() => {
    haptics.warning();
    Alert.alert('Delete Message', 'Remove this message from the conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(message.id) },
    ]);
  }, [haptics, message.id, onDelete]);

  const segments = parseMarkdown(message.content);

  const bubbleBg = isError
    ? colors.destructiveMuted
    : isUser
      ? colors.primaryMuted
      : colors.card;
  const bubbleBorder = isError
    ? colors.destructiveBorder
    : isUser
      ? colors.primaryBorder
      : colors.border;

  return (
    <Animated.View
      entering={Platform.OS !== 'web' ? FadeInDown.duration(240).delay(Math.min(index * 30, 150)) : undefined}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      {!isUser && (
        <View style={[styles.avatarDot, { backgroundColor: colors.primary }]} />
      )}
      <Pressable
        onLongPress={handleCopy}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.bubble,
          {
            backgroundColor: bubbleBg,
            borderColor: bubbleBorder,
            opacity: pressed ? 0.85 : 1,
          },
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {segments.map((seg, i) =>
          seg.type === 'code' ? (
            <View
              key={i}
              style={[styles.codeBlock, { backgroundColor: colors.input, borderColor: colors.borderMid }]}
            >
              <Text style={[styles.codeText, { color: colors.text, fontFamily: MONO_FONT }]}>
                {seg.content}
              </Text>
            </View>
          ) : (
            <Text key={i} style={[styles.text, { color: isUser ? colors.text : colors.text }]}>
              {seg.content}
            </Text>
          )
        )}

        {message.model && (
          <Text style={[styles.meta, { color: colors.textFaint }]}>
            {message.model}
            {message.tokens ? ` · ${message.tokens} tokens` : ''}
          </Text>
        )}

        {isError && (
          <Pressable onPress={onRetry} style={styles.retryRow}>
            <Feather name="refresh-cw" size={12} color={colors.destructive} />
            <Text style={[styles.retryText, { color: colors.destructive }]}>Retry</Text>
          </Pressable>
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={handleCopy} hitSlop={8} style={styles.actionBtn}>
          <Feather name="copy" size={13} color={colors.textFaint} />
        </Pressable>
        {onDelete && (
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.actionBtn}>
            <Feather name="trash-2" size={13} color={colors.textFaint} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatarDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginBottom: 10,
    flexShrink: 0,
  },
  bubble: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
    gap: 6,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
    fontFamily: 'Inter_400Regular',
  },
  codeBlock: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    marginVertical: 2,
  },
  codeText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  meta: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  retryText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  actions: {
    flexDirection: 'column',
    gap: 4,
    paddingBottom: 6,
    opacity: 0.6,
  },
  actionBtn: {
    padding: 2,
  },
});
