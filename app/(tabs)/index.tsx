import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Platform, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import { AGENT_ICONS } from '@/constants/agentConfig';
import type { Conversation } from '@/types';

function timeLabel(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return 'now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`;
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d`;
  return new Date(ts).toLocaleDateString();
}

function ConvItem({ conv, agentName, agentIcon, onPress, onDelete }: {
  conv: Conversation;
  agentName: string;
  agentIcon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  onDelete: () => void;
}) {
  const lastMsg = conv.messages[conv.messages.length - 1];
  return (
    <TouchableOpacity style={styles.convRow} onPress={onPress} activeOpacity={0.7} onLongPress={onDelete}>
      <View style={[styles.convIcon, conv.pinned && styles.convIconPinned]}>
        <Feather name={agentIcon} size={14} color="#8b5cf6" />
      </View>
      <View style={styles.convBody}>
        <View style={styles.convTop}>
          <Text style={styles.convTitle} numberOfLines={1}>{conv.title}</Text>
          <Text style={styles.convTime}>{timeLabel(conv.updatedAt)}</Text>
        </View>
        <View style={styles.convBottom}>
          <Text style={styles.convPreview} numberOfLines={1}>
            {lastMsg ? `${lastMsg.role === 'user' ? '→ ' : '← '}${lastMsg.content}` : `// chat with ${agentName}`}
          </Text>
          {(conv.totalTokens ?? 0) > 0 && (
            <Text style={styles.convTokens}>{conv.totalTokens}t</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { state, createConversation, deleteConversation } = useApp();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : insets.bottom + 50;

  const enabledAgents = useMemo(() => state.agents.filter(a => a.enabled), [state.agents]);

  const filteredConvs = useMemo(() => {
    let list = [...state.conversations].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    if (selectedAgent) list = list.filter(c => c.agentId === selectedAgent);
    if (search) list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [state.conversations, selectedAgent, search]);

  const handleNewChat = useCallback(async () => {
    const agentId = selectedAgent ?? enabledAgents[0]?.id ?? 'default-assistant';
    const conv = await createConversation(agentId);
    router.push(`/chat/${conv.id}`);
  }, [selectedAgent, enabledAgents, createConversation]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Chat', 'Remove this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(id) },
    ]);
  }, [deleteConversation]);

  const agentMap = useMemo(() => {
    const map = new Map<string, typeof state.agents[0]>();
    state.agents.forEach(a => map.set(a.id, a));
    return map;
  }, [state.agents]);

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        {showSearch ? (
          <View style={styles.searchRow}>
            <Feather name="search" size={14} color="#737373" />
            <TextInput
              style={styles.searchInput}
              placeholder="// search chats..."
              placeholderTextColor="#525252"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearch(''); }} hitSlop={8}>
              <Feather name="x" size={14} color="#737373" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <Feather name="message-circle" size={14} color="#8b5cf6" />
              <Text style={styles.headerTitle}>Chats</Text>
              {state.conversations.length > 0 && (
                <Text style={styles.headerCount}>{state.conversations.length}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.iconBtn} hitSlop={8}>
                <Feather name="search" size={16} color="#a1a1a1" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNewChat} style={styles.newBtn} activeOpacity={0.8}>
                <Feather name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Agent Filter */}
      {enabledAgents.length > 1 && (
        <View style={styles.agentBar}>
          <TouchableOpacity
            style={[styles.agentChip, !selectedAgent && styles.agentChipActive]}
            onPress={() => setSelectedAgent(null)}
          >
            <Text style={[styles.agentChipText, !selectedAgent && styles.agentChipTextActive]}>All</Text>
          </TouchableOpacity>
          {enabledAgents.map(a => (
            <TouchableOpacity
              key={a.id}
              style={[styles.agentChip, selectedAgent === a.id && styles.agentChipActive]}
              onPress={() => setSelectedAgent(selectedAgent === a.id ? null : a.id)}
            >
              <Feather
                name={AGENT_ICONS[a.icon] ?? 'cpu'}
                size={10}
                color={selectedAgent === a.id ? '#8b5cf6' : '#737373'}
              />
              <Text style={[styles.agentChipText, selectedAgent === a.id && styles.agentChipTextActive]}>
                {a.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Conversation List */}
      {filteredConvs.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="message-circle" size={28} color="#404040" />
          </View>
          <Text style={styles.emptyTitle}>
            {search ? 'No results' : 'No chats yet'}
          </Text>
          <Text style={styles.emptyDesc}>
            {search ? `// no chats matching "${search}"` : '// Start a conversation with an AI agent'}
          </Text>
          {!search && (
            <TouchableOpacity style={styles.emptyBtn} onPress={handleNewChat} activeOpacity={0.8}>
              <Feather name="plus" size={14} color="#8b5cf6" />
              <Text style={styles.emptyBtnText}>New Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredConvs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const agent = agentMap.get(item.agentId);
            return (
              <ConvItem
                conv={item}
                agentName={agent?.name ?? 'Assistant'}
                agentIcon={AGENT_ICONS[agent?.icon ?? 'bot'] ?? 'cpu'}
                onPress={() => router.push(`/chat/${item.id}`)}
                onDelete={() => handleDelete(item.id)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    minHeight: 56,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 18, fontWeight: '700' },
  headerCount: {
    fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 11,
    backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  newBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#171717', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13 },
  agentBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  agentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: '#171717', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  agentChipActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)' },
  agentChipText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 11 },
  agentChipTextActive: { color: '#8b5cf6' },
  listContent: { paddingBottom: 20 },
  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  convIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  convIconPinned: { borderColor: '#fbbf2466' },
  convBody: { flex: 1, gap: 3 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convTitle: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13, fontWeight: '600' },
  convTime: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview: { flex: 1, fontFamily: MONO_FONT, color: '#737373', fontSize: 11 },
  convTokens: { fontFamily: MONO_FONT, color: '#404040', fontSize: 10 },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 64 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontFamily: MONO_FONT, color: '#525252', fontSize: 11, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
});
