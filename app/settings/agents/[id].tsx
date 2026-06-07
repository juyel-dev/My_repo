import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { CAP_LABELS } from '@/constants/agentConfig';
import type { Capability } from '@/types';

const ALL_CAPS: Capability[] = ['tools', 'memory', 'vision', 'mcp', 'reasoning'];

export default function EditAgentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, updateAgent, deleteAgent } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const agent = state.agents.find(a => a.id === id);
  const [name, setName] = useState(agent?.name ?? '');
  const [desc, setDesc] = useState(agent?.description ?? '');
  const [prompt, setPrompt] = useState(agent?.systemPrompt ?? '');
  const [temperature, setTemperature] = useState(String(agent?.temperature ?? 0.7));
  const [maxTokens, setMaxTokens] = useState(String(agent?.maxTokens ?? 4096));
  const [caps, setCaps] = useState<Capability[]>(agent?.capabilities ?? []);
  const [selectedModel, setSelectedModel] = useState(agent?.modelId ?? '');

  if (!agent) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const isDefault = id === 'default-assistant';
  const enabledModels = state.models.filter(m => m.enabled);

  const toggleCap = (cap: Capability) => {
    haptics.selection();
    setCaps(prev => prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]);
  };

  const handleSave = async () => {
    haptics.medium();
    await updateAgent(id, {
      name: name.trim() || agent.name,
      description: desc.trim(),
      systemPrompt: prompt.trim(),
      temperature: Math.min(2, Math.max(0, parseFloat(temperature) || 0.7)),
      maxTokens: Math.min(200_000, Math.max(256, parseInt(maxTokens) || 4096)),
      capabilities: caps,
      modelId: selectedModel,
    });
    haptics.success();
    router.back();
  };

  const handleDelete = () => {
    if (isDefault) return;
    Alert.alert('Delete Agent', `Delete "${agent.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { haptics.error(); await deleteAgent(id); router.back(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{agent.name}</Text>
          {!isDefault && (
            <Pressable onPress={handleDelete} hitSlop={12}>
              <Feather name="trash-2" size={18} color={colors.destructive} />
            </Pressable>
          )}
          {isDefault && <View style={{ width: 22 }} />}
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 20 }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textDim }]}>NAME</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]} value={name} onChangeText={setName} />

          <Text style={[styles.label, { color: colors.textDim }]}>DESCRIPTION</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]} value={desc} onChangeText={setDesc} />

          <Text style={[styles.label, { color: colors.textDim }]}>MODEL</Text>
          {enabledModels.length === 0 ? (
            <Pressable onPress={() => router.push('/settings/providers/index')} style={[styles.emptyModel, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
              <Text style={[styles.emptyModelText, { color: colors.primary }]}>+ Add a provider to select a model</Text>
            </Pressable>
          ) : (
            <View style={styles.modelList}>
              {enabledModels.map(m => (
                <Pressable
                  key={m.id}
                  onPress={() => { haptics.selection(); setSelectedModel(m.id); }}
                  style={({ pressed }) => [
                    styles.modelChip,
                    {
                      backgroundColor: selectedModel === m.id ? colors.primaryMuted : colors.card,
                      borderColor: selectedModel === m.id ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.modelChipText, { color: selectedModel === m.id ? colors.primary : colors.textMuted }]}>
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[styles.label, { color: colors.textDim }]}>SYSTEM PROMPT</Text>
          <TextInput
            style={[styles.promptInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlignVertical="top"
            placeholder="You are a helpful assistant…"
            placeholderTextColor={colors.textFaint}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>CAPABILITIES</Text>
          <View style={styles.capsGrid}>
            {ALL_CAPS.map(cap => (
              <Pressable
                key={cap}
                onPress={() => toggleCap(cap)}
                style={({ pressed }) => [
                  styles.capChip,
                  {
                    backgroundColor: caps.includes(cap) ? colors.primaryMuted : colors.card,
                    borderColor: caps.includes(cap) ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.capText, { color: caps.includes(cap) ? colors.primary : colors.textMuted }]}>
                  {CAP_LABELS[cap]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.paramRow}>
            <View style={styles.paramField}>
              <Text style={[styles.label, { color: colors.textDim }]}>TEMPERATURE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.paramField}>
              <Text style={[styles.label, { color: colors.textDim }]}>MAX TOKENS</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                value={maxTokens}
                onChangeText={setMaxTokens}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1, marginTop: 20 },
            ]}
          >
            <Text style={styles.saveBtnText}>Save Agent</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  content: { padding: 20, gap: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginTop: 8, marginBottom: 2 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  promptInput: { minHeight: 120, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingTop: 12, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  modelList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modelChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  modelChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  emptyModel: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  emptyModelText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  capsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  capText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  paramRow: { flexDirection: 'row', gap: 12 },
  paramField: { flex: 1 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
