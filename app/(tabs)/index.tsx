import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert, FlatList, Platform, Pressable, StatusBar,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Conversation } from '@/types';

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function ConversationRow({ item, index, agentName, onPress, onDelete }: {
  item: Conversation;
  index: number;
  agentName: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const haptics = useHaptics();
  const lastMsg = item.messages[item.messages.length - 1];
  const preview = lastMsg?.content?.slice(0, 80) ?? 'No messages yet';

  const handleLongPress = () => {
    haptics.medium();
    Alert.alert('Delete Conversation', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 40).duration(300) : undefined}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
          <Feather name="cpu" size={16} color={colors.primary} />
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.rowTime, { color: colors.textFaint }]}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>
          <Text style={[styles.rowAgent, { color: colors.primary }]}>{agentName}</Text>
          <Text style={[styles.rowPreview, { color: colors.textDim }]} numberOfLines={1}>
            {preview}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, createConversation, deleteConversation } = useApp();
  const [search, setSearch] = useState('');

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = state.conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleNewChat = useCallback(async () => {
    haptics.medium();
    const defaultAgent = state.agents.find(a => a.enabled) ?? state.agents[0];
    if (!defaultAgent) return;
    const conv = await createConversation(defaultAgent.id);
    router.push(`/chat/${conv.id}`);
  }, [haptics, state.agents, createConversation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { paddingTop: top }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [
            styles.newBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {state.conversations.length > 0 && (
        <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.textFaint} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search chats…"
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={14} color={colors.textFaint} />
            </Pressable>
          )}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => {
          const agent = state.agents.find(a => a.id === item.agentId);
          return (
            <ConversationRow
              item={item}
              index={index}
              agentName={agent?.name ?? 'Assistant'}
              onPress={() => { haptics.light(); router.push(`/chat/${item.id}`); }}
              onDelete={() => deleteConversation(item.id)}
            />
          );
        }}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottom + 90 },
          filtered.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="message-circle"
            title={search ? 'No matches' : 'No conversations yet'}
            subtitle={search ? 'Try a different search term' : 'Tap + to start your first AI chat'}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  list: { padding: 12, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  rowTime: { fontSize: 11, fontFamily: 'Inter_400Regular', flexShrink: 0, marginLeft: 6 },
  rowAgent: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  rowPreview: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
