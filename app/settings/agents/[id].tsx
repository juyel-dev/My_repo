import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { AgentIcon, Capability } from '@/types';

const ICONS: { key: AgentIcon; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'bot', icon: 'cpu' }, { key: 'code', icon: 'code' }, { key: 'globe', icon: 'globe' },
  { key: 'cpu', icon: 'zap' }, { key: 'flask', icon: 'activity' }, { key: 'brain', icon: 'eye' },
];

const CAPS: { key: Capability; icon: keyof typeof Feather.glyphMap; label: string; color: string }[] = [
  { key: 'tools', icon: 'tool', label: 'Tools', color: '#8b5cf6' },
  { key: 'memory', icon: 'database', label: 'Memory', color: '#3b82f6' },
  { key: 'vision', icon: 'eye', label: 'Vision', color: '#fbbf24' },
  { key: 'mcp', icon: 'server', label: 'MCP', color: '#4ade80' },
  { key: 'reasoning', icon: 'activity', label: 'Reasoning', color: '#f97316' },
];

const DEFAULT_NEW_AGENT = {
  name: '',
  description: '',
  icon: 'bot' as AgentIcon,
  modelId: '',
  systemPrompt: 'You are a helpful AI assistant.',
  capabilities: ['tools', 'memory'] as Capability[],
  mcpServerIds: [],
  temperature: 0.7,
  maxTokens: 4096,
  enabled: true,
};

export default function AgentEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, addAgent, updateAgent, deleteAgent } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const isNew = id === 'new';
  const existing = isNew ? null : state.agents.find(a => a.id === id);

  const init = existing ?? DEFAULT_NEW_AGENT;
  const [name, setName] = useState(init.name);
  const [desc, setDesc] = useState(init.description);
  const [icon, setIcon] = useState<AgentIcon>(init.icon);
  const [modelId, setModelId] = useState(init.modelId);
  const [systemPrompt, setSystemPrompt] = useState(init.systemPrompt);
  const [caps, setCaps] = useState<Capability[]>(init.capabilities);
  const [temperature, setTemperature] = useState(init.temperature.toString());
  const [maxTokens, setMaxTokens] = useState(init.maxTokens.toString());
  const [saving, setSaving] = useState(false);

  const enabledModels = state.models.filter(m => m.enabled);

  const toggleCap = (cap: Capability) => {
    setCaps(prev => prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Agent name is required.'); return; }
    setSaving(true);
    try {
      const data = {
        name: name.trim(), description: desc.trim(), icon, modelId,
        systemPrompt: systemPrompt.trim(), capabilities: caps,
        mcpServerIds: existing?.mcpServerIds ?? [],
        temperature: parseFloat(temperature) || 0.7,
        maxTokens: parseInt(maxTokens) || 4096,
        enabled: existing?.enabled ?? true,
      };
      if (isNew) {
        await addAgent(data);
      } else {
        await updateAgent(id, data);
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing || id === 'default-assistant') {
      Alert.alert('Cannot Delete', 'The default assistant cannot be deleted.');
      return;
    }
    Alert.alert('Delete Agent', `Remove "${existing.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAgent(id); router.back(); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? 'New Agent' : 'Edit Agent'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Icon & Name */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// BASIC'}</Text>
          <Text style={styles.fieldLabel}>AVATAR / ICON</Text>
          <View style={styles.iconRow}>
            {ICONS.map(i => (
              <TouchableOpacity
                key={i.key}
                style={[styles.iconOption, icon === i.key && styles.iconOptionActive]}
                onPress={() => setIcon(i.key)}
              >
                <Feather name={i.icon} size={16} color={icon === i.key ? '#8b5cf6' : '#737373'} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>AGENT NAME</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. ResearchBot"
              placeholderTextColor="#525252"
              autoCapitalize="words"
            />
          </View>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={desc}
              onChangeText={setDesc}
              placeholder="// brief description of this agent"
              placeholderTextColor="#525252"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Model */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// MODEL'}</Text>
          {enabledModels.length === 0 ? (
            <Text style={styles.noModels}>// No models enabled. Add a provider first.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelScroll}>
              {enabledModels.map(m => {
                const provider = state.providers.find(p => p.id === m.providerId);
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modelChip, modelId === m.id && styles.modelChipActive]}
                    onPress={() => setModelId(m.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modelChipText, modelId === m.id && styles.modelChipTextActive]}>{m.name}</Text>
                    <Text style={styles.modelProvider}>{provider?.name ?? ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Capabilities */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// CAPABILITIES'}</Text>
          <View style={styles.capsGrid}>
            {CAPS.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[styles.capOption, caps.includes(c.key) && { backgroundColor: `${c.color}20`, borderColor: `${c.color}60` }]}
                onPress={() => toggleCap(c.key)}
                activeOpacity={0.7}
              >
                <Feather name={c.icon} size={12} color={caps.includes(c.key) ? c.color : '#737373'} />
                <Text style={[styles.capOptionText, caps.includes(c.key) && { color: c.color }]}>{c.label}</Text>
                {caps.includes(c.key) && <Feather name="check" size={10} color={c.color} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Prompt */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// SYSTEM PROMPT'}</Text>
          <View style={styles.promptBox}>
            <TextInput
              style={styles.promptInput}
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              multiline
              numberOfLines={4}
              placeholder="// system instructions..."
              placeholderTextColor="#525252"
            />
          </View>
        </View>

        {/* Parameters */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// PARAMETERS'}</Text>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Temperature</Text>
            <View style={styles.paramInput}>
              <TextInput
                style={styles.paramValue}
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Max Tokens</Text>
            <View style={styles.paramInput}>
              <TextInput
                style={styles.paramValue}
                value={maxTokens}
                onChangeText={setMaxTokens}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {!isNew && id !== 'default-assistant' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Feather name="trash-2" size={14} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Delete Agent</Text>
          </TouchableOpacity>
        )}
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
  saveBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
  },
  saveBtnText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 12 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: '#171717', borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 14, gap: 10,
  },
  cardLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  fieldLabel: { fontFamily: MONO_FONT, color: '#737373', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconOption: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  iconOptionActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.5)' },
  inputRow: {
    backgroundColor: '#0d0d0d', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 10,
  },
  input: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13 },
  noModels: { fontFamily: MONO_FONT, color: '#525252', fontSize: 11 },
  modelScroll: { marginHorizontal: -4 },
  modelChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginHorizontal: 4,
    backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  modelChipActive: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.5)' },
  modelChipText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  modelChipTextActive: { color: '#8b5cf6' },
  modelProvider: { fontFamily: MONO_FONT, color: '#404040', fontSize: 9, marginTop: 2 },
  capsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
    backgroundColor: '#262626', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  capOptionText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 11 },
  promptBox: {
    backgroundColor: '#0d0d0d', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12,
  },
  promptInput: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 12, lineHeight: 18, minHeight: 80 },
  paramRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paramLabel: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 13 },
  paramInput: {
    backgroundColor: '#0d0d0d', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6,
  },
  paramValue: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13, minWidth: 60, textAlign: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  deleteBtnText: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
