import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert, FlatList, Platform, Pressable, StyleSheet, Switch, Text, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { CapabilityChip } from '@/components/ui/CapabilityChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { AGENT_ICONS } from '@/constants/agentConfig';
import type { Agent } from '@/types';

function AgentRow({ item, index }: { item: Agent; index: number }) {
  const colors = useColors();
  const haptics = useHaptics();
  const { toggleAgent, deleteAgent } = useApp();
  const icon = AGENT_ICONS[item.icon] ?? 'cpu';
  const isDefault = item.id === 'default-assistant';

  const handleLongPress = () => {
    if (isDefault) return;
    haptics.medium();
    Alert.alert('Delete Agent', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAgent(item.id) },
    ]);
  };

  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 50).duration(300) : undefined}>
      <Pressable
        onPress={() => { haptics.light(); router.push(`/settings/agents/${item.id}`); }}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, borderColor: item.enabled ? colors.primaryBorder : colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            {isDefault && (
              <View style={[styles.badge, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>default</Text>
              </View>
            )}
          </View>
          <Text style={[styles.desc, { color: colors.textDim }]} numberOfLines={1}>{item.description}</Text>
          <View style={styles.caps}>
            {item.capabilities.slice(0, 3).map(c => <CapabilityChip key={c} capability={c} />)}
          </View>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => { haptics.selection(); toggleAgent(item.id); }}
          trackColor={{ false: colors.chip, true: colors.primary }}
          thumbColor="#fff"
        />
      </Pressable>
    </Animated.View>
  );
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, addAgent } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAdd = async () => {
    haptics.medium();
    const agent = await addAgent({
      name: 'New Agent',
      description: 'Custom AI agent',
      icon: 'bot',
      modelId: state.models.find(m => m.enabled)?.id ?? '',
      systemPrompt: 'You are a helpful AI assistant.',
      capabilities: ['tools'],
      mcpServerIds: [],
      temperature: 0.7,
      maxTokens: 4096,
      enabled: true,
    });
    router.push(`/settings/agents/${agent.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Agents</Text>
        <Pressable
          onPress={handleAdd}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={state.agents}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <AgentRow item={item} index={index} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottom + 20 },
          state.agents.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={<EmptyState icon="user" title="No agents" subtitle="Create a custom AI agent" />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!state.agents.length}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  addBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, gap: 10 },
  row: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, flexDirection: 'row', alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  caps: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
