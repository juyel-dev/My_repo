import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { Capability } from '@/types';

const AGENT_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  bot: 'cpu', code: 'code', globe: 'globe', cpu: 'cpu', flask: 'zap', brain: 'activity',
};
const CAP_ICONS: Record<Capability, keyof typeof Feather.glyphMap> = {
  tools: 'tool', memory: 'database', vision: 'eye', mcp: 'server', reasoning: 'activity',
};
const CAP_COLORS: Record<Capability, string> = {
  tools: '#8b5cf6', memory: '#3b82f6', vision: '#fbbf24', mcp: '#4ade80', reasoning: '#f97316',
};

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const { state, deleteAgent, toggleAgent } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleDelete = (id: string, name: string) => {
    if (id === 'default-assistant') { Alert.alert('Cannot Delete', 'The default assistant cannot be deleted.'); return; }
    Alert.alert('Delete Agent', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAgent(id) },
    ]);
  };

  const createDefaultAgent = () => {
    router.push('/settings/agents/new');
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>Agent Settings</Text>
        <TouchableOpacity onPress={createDefaultAgent} style={styles.addBtn} activeOpacity={0.8}>
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{'// CONFIGURED AGENTS'}</Text>

        {state.agents.map(agent => {
          const model = state.models.find(m => m.id === agent.modelId);
          return (
            <View key={agent.id} style={[styles.card, !agent.enabled && styles.cardDisabled]}>
              <View style={[styles.accent, agent.enabled && styles.accentActive]} />
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Feather name={AGENT_ICONS[agent.icon] ?? 'cpu'} size={16} color="#8b5cf6" />
                  </View>
                  <View style={styles.agentInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.agentName}>{agent.name}</Text>
                      <TouchableOpacity onPress={() => toggleAgent(agent.id)} hitSlop={8}>
                        <Feather name={agent.enabled ? 'toggle-right' : 'toggle-left'} size={22} color={agent.enabled ? '#8b5cf6' : '#525252'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push(`/settings/agents/${agent.id}`)} hitSlop={8}>
                        <Feather name="edit-2" size={14} color="#737373" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(agent.id, agent.name)} hitSlop={8}>
                        <Feather name="trash-2" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.agentModel}>{model?.name ?? '// no model'}</Text>
                  </View>
                </View>
                <Text style={styles.agentDesc} numberOfLines={1}>{agent.description || '// no description'}</Text>
                <View style={styles.capRow}>
                  {agent.capabilities.map(cap => (
                    <View key={cap} style={[styles.capBadge, { backgroundColor: `${CAP_COLORS[cap]}20` }]}>
                      <Feather name={CAP_ICONS[cap]} size={9} color={CAP_COLORS[cap]} />
                      <Text style={[styles.capText, { color: CAP_COLORS[cap] }]}>
                        {cap.charAt(0).toUpperCase() + cap.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        {/* Add new */}
        <TouchableOpacity style={styles.addMoreBtn} onPress={createDefaultAgent} activeOpacity={0.8}>
          <Feather name="plus" size={14} color="#8b5cf6" />
          <Text style={styles.addMoreText}>Create New Agent</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  card: {
    backgroundColor: '#171717', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', overflow: 'hidden',
  },
  cardDisabled: { opacity: 0.55 },
  accent: { width: 3, backgroundColor: 'transparent' },
  accentActive: { backgroundColor: '#8b5cf6' },
  cardContent: { flex: 1, padding: 12, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.15)', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  agentInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentName: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14, fontWeight: '700' },
  agentModel: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10, marginTop: 1 },
  agentDesc: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10, fontStyle: 'italic' },
  capRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  capBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  capText: { fontFamily: MONO_FONT, fontSize: 9, letterSpacing: 0.5 },
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderStyle: 'dashed',
    marginTop: 4,
  },
  addMoreText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
});
