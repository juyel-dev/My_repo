import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { Message } from '@/types';

const QUICK_PROMPTS = ['// summarize', '// explain', '// translate', '// code review'];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={styles.avatarBot}>
          <Feather name="cpu" size={12} color="#8b5cf6" />
        </View>
      )}
      <View style={styles.msgContent}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          {!isUser && msg.model && (
            <Text style={styles.modelLabel}>// {msg.model}</Text>
          )}
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{msg.content}</Text>
          {msg.mcpInfo && <Text style={styles.mcpInfo}>{msg.mcpInfo}</Text>}
          <Text style={[styles.msgTime, isUser && styles.msgTimeUser]}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!isUser && (
          <View style={styles.msgActions}>
            <TouchableOpacity
              style={styles.msgAction}
              onPress={() => {}}
              hitSlop={8}
            >
              <Feather name="copy" size={11} color="#525252" />
              <Text style={styles.msgActionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.msgAction} onPress={() => {}} hitSlop={8}>
              <Feather name="refresh-cw" size={11} color="#525252" />
              <Text style={styles.msgActionText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, addMessage, sendMessage, getActiveModel, updateConversation } = useApp();
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const flatRef = useRef<FlatList>(null);

  const conversation = state.conversations.find(c => c.id === id);
  const agent = state.agents.find(a => a.id === conversation?.agentId);
  const hasModel = conversation ? !!getActiveModel(conversation.agentId) : false;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const messages = useMemo(
    () => [...(conversation?.messages ?? [])].reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversation?.messages.length, conversation?.id],
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming || !conversation) return;
    const content = input.trim();
    setInput('');

    if (!hasModel) {
      Alert.alert('No Model', 'Please add an API provider and model in Settings.', [
        { text: 'Go to Settings', onPress: () => router.push('/settings/providers/') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (state.settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await addMessage(id, { role: 'user', content, timestamp: Date.now() });

    setStreaming(true);
    setStreamText('');
    try {
      await sendMessage(id, content, (text) => {
        setStreamText(text);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await addMessage(id, {
        role: 'assistant',
        content: `// Error: ${msg}`,
        timestamp: Date.now(),
      });
    } finally {
      setStreaming(false);
      setStreamText('');
    }
  }, [input, streaming, conversation, hasModel, id, addMessage, sendMessage, state.settings.hapticFeedback]);

  if (!conversation) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>// Conversation not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const AGENT_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
    bot: 'cpu', code: 'code', globe: 'globe', cpu: 'cpu', flask: 'zap', brain: 'activity',
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.agentSelector} activeOpacity={0.7}>
          <View style={styles.agentIconBox}>
            <Feather name={AGENT_ICONS[agent?.icon ?? 'bot'] ?? 'cpu'} size={14} color="#8b5cf6" />
          </View>
          <View>
            <Text style={styles.agentName}>{agent?.name ?? 'Assistant'}</Text>
            <Text style={styles.agentModel}>{hasModel ? getActiveModel(conversation.agentId)?.name : '// no model'}</Text>
          </View>
          <Feather name="chevron-down" size={14} color="#737373" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconBtn, state.mcpServers.some(s => s.enabled && s.status === 'connected') && styles.iconBtnActive]} hitSlop={8}>
            <Feather name="server" size={15} color={state.mcpServers.some(s => s.enabled) ? '#4ade80' : '#737373'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} hitSlop={8}>
            <Feather name="more-vertical" size={15} color="#737373" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        inverted
        contentContainerStyle={[styles.listContent, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          streaming ? (
            <View style={styles.streamingRow}>
              <View style={styles.avatarBot}>
                <Feather name="cpu" size={12} color="#8b5cf6" />
              </View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                {streamText ? (
                  <Text style={styles.msgText}>{streamText}</Text>
                ) : (
                  <View style={styles.typingDots}>
                    <ActivityIndicator size="small" color="#8b5cf6" />
                  </View>
                )}
              </View>
            </View>
          ) : null
        }
      />

      {/* Input Area */}
      <View style={[styles.inputArea, { paddingBottom: bottomPad || 16 }]}>
        <View style={styles.tokenBar}>
          <Text style={styles.tokenText}>// {conversation.totalTokens ?? 0} tokens</Text>
          <Text style={styles.tokenText}>{agent?.name ?? 'Assistant'}</Text>
        </View>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputIcon} hitSlop={8}>
            <Feather name="paperclip" size={16} color="#737373" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon} hitSlop={8}>
            <Feather name="mic" size={16} color="#737373" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={`// message ${agent?.name ?? 'assistant'}...`}
            placeholderTextColor="#404040"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || streaming}
            activeOpacity={0.8}
          >
            <Feather name="arrow-up" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.quickPromptsRow}>
          {QUICK_PROMPTS.map(p => (
            <TouchableOpacity
              key={p} style={styles.quickChip}
              onPress={() => setInput(p.replace('// ', ''))}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  center: { flex: 1, backgroundColor: '#0d0d0d', justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFound: { fontFamily: MONO_FONT, color: '#737373', fontSize: 14 },
  backLink: { padding: 8 },
  backLinkText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
  },
  agentSelector: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#171717', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  agentIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  agentName: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13, fontWeight: '600' },
  agentModel: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  iconBtnActive: { borderColor: 'rgba(74,222,128,0.3)' },
  listContent: { paddingHorizontal: 12, paddingTop: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatarBot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexShrink: 0,
  },
  msgContent: { flex: 1, gap: 4 },
  bubble: {
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
    maxWidth: '90%',
  },
  bubbleUser: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
    borderBottomRightRadius: 4, alignSelf: 'flex-end',
  },
  bubbleBot: {
    backgroundColor: '#171717',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4, alignSelf: 'flex-start',
  },
  modelLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  msgText: { fontFamily: MONO_FONT, color: '#e5e5e5', fontSize: 13, lineHeight: 19 },
  msgTextUser: { color: '#f5f5f5' },
  mcpInfo: { fontFamily: MONO_FONT, color: '#737373', fontSize: 9, marginTop: 4 },
  msgTime: { fontFamily: MONO_FONT, color: '#525252', fontSize: 9, textAlign: 'right', marginTop: 4 },
  msgTimeUser: { textAlign: 'right' },
  msgActions: { flexDirection: 'row', gap: 12, paddingLeft: 4 },
  msgAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  msgActionText: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10 },
  streamingRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16,
  },
  typingDots: { paddingHorizontal: 4, paddingVertical: 4 },
  inputArea: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0d0d0d', paddingTop: 8, paddingHorizontal: 12, gap: 8,
  },
  tokenBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  tokenText: { fontFamily: MONO_FONT, color: '#404040', fontSize: 9 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#171717', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  inputIcon: { padding: 4 },
  input: {
    flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13,
    maxHeight: 100, minHeight: 20,
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  quickPromptsRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  quickChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: '#171717', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  quickChipText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10 },
});
