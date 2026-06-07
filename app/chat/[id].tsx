import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { MessageBubble } from '@/components/ui/MessageBubble';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Message } from '@/types';

const HEADER_HEIGHT = 56;

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const {
    state, addMessage, deleteMessage, deleteLastAssistantMessage,
    sendMessage, getActiveModel,
  } = useApp();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);

  const conversation = state.conversations.find(c => c.id === id);
  const agent = conversation ? state.agents.find(a => a.id === conversation.agentId) : null;
  const model = agent ? getActiveModel(agent.id) : null;

  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const headerTop = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (!conversation) {
      router.replace('/(tabs)');
    }
  }, [conversation]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    if (!model) {
      Alert.alert(
        'No Model Selected',
        'Add an AI provider and enable a model in Settings → Providers.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => router.push('/settings/providers/index') },
        ]
      );
      return;
    }

    haptics.medium();
    setInput('');
    setError(null);
    setIsStreaming(true);
    setStreamingText('');

    await addMessage(id, { role: 'user', content: text, timestamp: Date.now() });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await sendMessage(
        id,
        text,
        (partial) => setStreamingText(partial),
        controller.signal,
      );
      haptics.light();
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        if (streamingText) {
          await addMessage(id, {
            role: 'assistant',
            content: streamingText + ' *(stopped)*',
            timestamp: Date.now(),
          });
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(msg);
        haptics.error();
        await addMessage(id, {
          role: 'assistant',
          content: msg,
          timestamp: Date.now(),
          error: true,
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }, [input, isStreaming, model, haptics, addMessage, id, sendMessage, streamingText]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback(async () => {
    if (!conversation || isStreaming) return;
    const msgs = conversation.messages;
    const lastUser = [...msgs].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    await deleteLastAssistantMessage(id);
    setInput(lastUser.content);
  }, [conversation, isStreaming, deleteLastAssistantMessage, id]);

  const handleDeleteMessage = useCallback(async (msgId: string) => {
    await deleteMessage(id, msgId);
  }, [deleteMessage, id]);

  const displayMessages: Message[] = conversation?.messages ?? [];
  const reversedMessages = [...displayMessages].reverse();

  if (!conversation) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const showEmpty = displayMessages.length === 0 && !isStreaming;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: headerTop,
            backgroundColor: colors.backgroundElevated,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.headerDot, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
            <Feather name="cpu" size={13} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {conversation.title}
            </Text>
            {agent && (
              <Text style={[styles.headerSub, { color: colors.textDim }]}>
                {agent.name}
                {model ? ` · ${model.name}` : ''}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={() =>
            Alert.alert('Clear Chat', 'Clear all messages in this conversation?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: () => {
                  displayMessages.forEach(m => deleteMessage(id, m.id));
                  haptics.warning();
                },
              },
            ])
          }
          hitSlop={12}
        >
          <Feather name="trash-2" size={18} color={colors.textFaint} />
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={item => item.id}
          inverted
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              index={index}
              onDelete={handleDeleteMessage}
              onRetry={item.error ? handleRetry : undefined}
            />
          )}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: 8 },
            showEmpty && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isStreaming ? (
              streamingText ? (
                <MessageBubble
                  message={{
                    id: '__streaming__',
                    role: 'assistant',
                    content: streamingText,
                    timestamp: Date.now(),
                  }}
                  index={0}
                />
              ) : (
                <TypingIndicator visible />
              )
            ) : null
          }
          ListEmptyComponent={
            showEmpty ? (
              <EmptyState
                icon="message-square"
                title={agent?.name ?? 'Assistant'}
                subtitle={agent?.description ?? 'Send a message to start chatting'}
              />
            ) : null
          }
        />

        {/* Error banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructiveMuted, borderColor: colors.destructiveBorder }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]} numberOfLines={2}>
              {error}
            </Text>
            <Pressable onPress={() => setError(null)} hitSlop={8}>
              <Feather name="x" size={14} color={colors.destructive} />
            </Pressable>
          </View>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: colors.backgroundElevated,
              borderTopColor: colors.border,
              paddingBottom: bottom + 8,
            },
          ]}
        >
          <View style={[styles.inputBox, { backgroundColor: colors.input, borderColor: colors.borderMid }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Message…"
              placeholderTextColor={colors.textFaint}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={4000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isStreaming}
            />

            {isStreaming ? (
              <Pressable onPress={handleStop} style={[styles.sendBtn, { backgroundColor: colors.destructive }]}>
                <Feather name="square" size={16} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSend}
                disabled={!input.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: input.trim() ? colors.primary : colors.chip,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="send" size={16} color={input.trim() ? '#fff' : colors.textFaint} />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerBack: { flexShrink: 0 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerDot: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  messageList: { paddingTop: 12, gap: 0 },
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    minHeight: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    maxHeight: 120,
    paddingTop: 6,
    paddingBottom: 6,
    lineHeight: 20,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
