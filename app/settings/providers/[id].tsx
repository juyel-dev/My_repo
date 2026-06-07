import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, updateProvider, toggleProvider, deleteProvider, toggleModel, deleteModel } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const provider = state.providers.find(p => p.id === id);
  const models = state.models.filter(m => m.providerId === id);

  const [apiKey, setApiKey] = useState(provider?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? '');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!provider) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.notFound}>// Provider not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await updateProvider(id, { apiKey: apiKey.trim(), baseUrl: baseUrl.trim() || undefined });
    setSaving(false);
    Alert.alert('Saved', 'Provider settings updated.');
  };

  const handleDelete = () => {
    Alert.alert('Delete Provider', `This will also delete ${models.length} models. Continue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteProvider(id);
          router.back();
        }
      },
    ]);
  };

  const CAP_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
    tools: 'tool', memory: 'database', vision: 'eye', mcp: 'server', reasoning: 'activity',
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>{provider.name}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Status */}
        <View style={[styles.statusCard, provider.enabled ? styles.statusCardOn : styles.statusCardOff]}>
          <View style={[styles.statusDot, provider.enabled ? styles.dotOn : styles.dotOff]} />
          <Text style={[styles.statusText, provider.enabled ? styles.statusTextOn : styles.statusTextOff]}>
            {provider.enabled ? 'Active' : 'Disabled'}
          </Text>
          <Text style={styles.providerType}>{provider.type.toUpperCase()}</Text>
          <TouchableOpacity
            style={[styles.toggleSwitch, provider.enabled && styles.toggleSwitchOn]}
            onPress={() => toggleProvider(id)}
            hitSlop={8}
          >
            <Feather name={provider.enabled ? 'toggle-right' : 'toggle-left'} size={24} color={provider.enabled ? '#8b5cf6' : '#525252'} />
          </TouchableOpacity>
        </View>

        {/* API Key */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// AUTHENTICATION'}</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Feather name="key" size={13} color="#8b5cf6" />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="API key..."
                placeholderTextColor="#525252"
              />
              <TouchableOpacity onPress={() => setShowKey(v => !v)} hitSlop={8}>
                <Feather name={showKey ? 'eye-off' : 'eye'} size={14} color="#737373" />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.inputRow}>
              <Feather name="link" size={13} color="#737373" />
              <TextInput
                style={styles.input}
                value={baseUrl}
                onChangeText={setBaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Base URL (optional)"
                placeholderTextColor="#525252"
                keyboardType="url"
              />
            </View>
          </View>
        </View>

        {/* Models */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// MODELS'}</Text>
          <View style={styles.card}>
            {models.length === 0 ? (
              <Text style={styles.noModels}>// no models configured</Text>
            ) : (
              models.map((m, i) => (
                <View key={m.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.modelRow}>
                    <View style={styles.modelLeft}>
                      <View style={[styles.modelActiveDot, m.enabled ? styles.modelActiveDotOn : styles.modelActiveDotOff]} />
                      <View>
                        <Text style={styles.modelName}>{m.name}</Text>
                        <View style={styles.capRow}>
                          {m.capabilities.map(cap => (
                            <View key={cap} style={styles.capBadge}>
                              <Feather name={CAP_ICONS[cap] ?? 'zap'} size={9} color="#8b5cf6" />
                            </View>
                          ))}
                          <Text style={styles.ctxText}>{(m.contextLength / 1000).toFixed(0)}K</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.modelActions}>
                      <TouchableOpacity onPress={() => toggleModel(m.id)} hitSlop={8}>
                        <Feather name={m.enabled ? 'toggle-right' : 'toggle-left'} size={20} color={m.enabled ? '#8b5cf6' : '#525252'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteModel(m.id)} hitSlop={8}>
                        <Feather name="trash-2" size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Danger */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Feather name="trash-2" size={14} color="#ef4444" />
          <Text style={styles.deleteBtnText}>Delete Provider</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  notFound: { fontFamily: MONO_FONT, color: '#737373', fontSize: 14, textAlign: 'center', marginTop: 48 },
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
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  statusCardOn: { backgroundColor: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' },
  statusCardOff: { backgroundColor: '#171717', borderColor: 'rgba(255,255,255,0.08)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: '#4ade80' },
  dotOff: { backgroundColor: '#525252' },
  statusText: { fontFamily: MONO_FONT, fontSize: 12, flex: 1 },
  statusTextOn: { color: '#4ade80' },
  statusTextOff: { color: '#737373' },
  providerType: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10, letterSpacing: 1 },
  toggleSwitch: {},
  toggleSwitchOn: {},
  section: { gap: 8 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  card: { backgroundColor: '#171717', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },
  noModels: { fontFamily: MONO_FONT, color: '#525252', fontSize: 11, padding: 14 },
  modelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  modelLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modelActiveDot: { width: 6, height: 6, borderRadius: 3 },
  modelActiveDotOn: { backgroundColor: '#8b5cf6' },
  modelActiveDotOff: { backgroundColor: '#404040' },
  modelName: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13 },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  capBadge: {
    width: 16, height: 16, borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  ctxText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 9 },
  modelActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  deleteBtnText: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
