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
import { EmptyState } from '@/components/ui/EmptyState';
import type { MCPServer } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  connected: '#4ade80',
  disconnected: '#71717a',
  error: '#ef4444',
};

function MCPRow({ item, index }: { item: MCPServer; index: number }) {
  const colors = useColors();
  const haptics = useHaptics();
  const { toggleMCPServer, deleteMCPServer } = useApp();
  const statusColor = STATUS_COLORS[item.status] ?? colors.textDim;

  const handleLongPress = () => {
    haptics.medium();
    Alert.alert('Delete MCP Server', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMCPServer(item.id) },
    ]);
  };

  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 50).duration(300) : undefined}>
      <Pressable
        onPress={() => { haptics.light(); router.push(`/settings/mcp/${item.id}`); }}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
          <Feather name="server" size={16} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
          </View>
          <Text style={[styles.url, { color: colors.textDim }]} numberOfLines={1}>{item.url}</Text>
          <Text style={[styles.transport, { color: colors.textFaint }]}>{item.transport}</Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => { haptics.selection(); toggleMCPServer(item.id); }}
          trackColor={{ false: colors.chip, true: colors.primary }}
          thumbColor="#fff"
        />
      </Pressable>
    </Animated.View>
  );
}

export default function MCPScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, addMCPServer } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAdd = async () => {
    haptics.medium();
    const server = await addMCPServer({ name: 'New MCP Server', transport: 'SSE', url: '', enabled: false });
    router.push(`/settings/mcp/${server.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>MCP Servers</Text>
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
        data={state.mcpServers}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <MCPRow item={item} index={index} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottom + 20 },
          state.mcpServers.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="server"
            title="No MCP servers"
            subtitle="Connect Model Context Protocol servers to give agents access to external tools"
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!state.mcpServers.length}
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
  list: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  url: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  transport: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
