import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { ProviderType } from '@/types';

const PROVIDERS: { type: ProviderType; name: string; placeholder: string; defaultUrl: string }[] = [
  { type: 'openai', name: 'OpenAI', placeholder: 'sk-...', defaultUrl: 'https://api.openai.com/v1' },
  { type: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...', defaultUrl: 'https://api.anthropic.com' },
  { type: 'gemini', name: 'Google Gemini', placeholder: 'AIza...', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { type: 'custom', name: 'Custom / Ollama', placeholder: 'optional', defaultUrl: 'http://localhost:11434/v1' },
];

const API_TYPES = ['OpenAI Compatible', 'Anthropic', 'Google Gemini', 'Ollama (Local)', 'Custom / Raw HTTP'];

async function testEndpoint(baseUrl: string, apiKey: string, type: ProviderType): Promise<{ ok: boolean; message: string }> {
  try {
    const url = type === 'anthropic'
      ? `${baseUrl}/v1/models`
      : `${baseUrl}/models`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (type === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(url, { method: 'GET', headers });

    if (res.ok) return { ok: true, message: `Connected (${res.status})` };
    if (res.status === 401) return { ok: false, message: 'Invalid API key (401)' };
    if (res.status === 403) return { ok: false, message: 'Forbidden — check key permissions (403)' };
    return { ok: false, message: `Server responded with ${res.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Network') || msg.includes('fetch')) {
      return { ok: false, message: 'Cannot reach endpoint — check URL and network' };
    }
    return { ok: false, message: msg };
  }
}

export default function AddProviderScreen() {
  const insets = useSafeAreaInsets();
  const { addProvider } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [type, setType] = useState<ProviderType>('custom');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [apiType, setApiType] = useState('OpenAI Compatible');

  const selectedProvider = PROVIDERS.find(p => p.type === type)!;
  const effectiveUrl = baseUrl.trim() || selectedProvider.defaultUrl;

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a provider name.'); return; }
    setSaving(true);
    try {
      await addProvider({
        name: name.trim(),
        type,
        apiKey: apiKey.trim(),
        baseUrl: effectiveUrl,
        enabled,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testEndpoint(effectiveUrl, apiKey.trim(), type);
    setTestResult(result);
    setTesting(false);
    if (result.ok) {
      Alert.alert('Connection Successful', result.message);
    } else {
      Alert.alert('Connection Failed', result.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Custom Provider</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>{'// NEW CUSTOM PROVIDER'}</Text>

        {/* Enable toggle */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Feather name="settings" size={14} color="#8b5cf6" />
            <Text style={styles.rowLabel}>Enable this service</Text>
            <TouchableOpacity onPress={() => setEnabled(v => !v)} hitSlop={8}>
              <Feather name={enabled ? 'toggle-right' : 'toggle-left'} size={24} color={enabled ? '#8b5cf6' : '#525252'} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Custom Provider Name</Text>
            <View style={styles.inputRow}>
              <Feather name="tag" size={13} color="#737373" />
              <TextInput
                style={styles.input}
                placeholder="e.g. My Local LLM"
                placeholderTextColor="#525252"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        {/* Base URL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="globe" size={13} color="#8b5cf6" />
            <Text style={styles.cardHeaderText}>{'// Base URL / API Host'}</Text>
          </View>
          <View style={styles.inputRow}>
            <Feather name="link" size={13} color="#737373" />
            <TextInput
              style={styles.input}
              placeholder={selectedProvider.defaultUrl}
              placeholderTextColor="#525252"
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          <Text style={styles.hint}>// Leave blank to use provider default</Text>
        </View>

        {/* API Type */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="layers" size={13} color="#8b5cf6" />
            <Text style={styles.cardHeaderText}>{'// API Type'}</Text>
          </View>
          <TouchableOpacity style={styles.selectRow} onPress={() => setShowTypeMenu(v => !v)} activeOpacity={0.7}>
            <Text style={styles.selectValue}>{apiType}</Text>
            <Feather name={showTypeMenu ? 'chevron-up' : 'chevron-down'} size={14} color="#737373" />
          </TouchableOpacity>
          {showTypeMenu && (
            <View style={styles.typeMenu}>
              {API_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOption, apiType === t && styles.typeOptionActive]}
                  onPress={() => { setApiType(t); setShowTypeMenu(false); }}
                >
                  <View style={[styles.typeDot, apiType === t ? styles.typeDotActive : styles.typeDotInactive]} />
                  <Text style={[styles.typeText, apiType === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* API Key */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="key" size={13} color="#8b5cf6" />
            <Text style={styles.cardHeaderText}>{'// API Key'}</Text>
          </View>
          <View style={[styles.inputRow, { flex: 0 }]}>
            <Feather name="key" size={13} color="#737373" />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={selectedProvider.placeholder}
              placeholderTextColor="#525252"
              value={apiKey}
              onChangeText={(v) => { setApiKey(v); setTestResult(null); }}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(v => !v)} hitSlop={8}>
              <Feather name={showKey ? 'eye-off' : 'eye'} size={13} color="#737373" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>// stored securely on-device only</Text>
        </View>

        {/* Test result indicator */}
        {testResult && (
          <View style={[styles.testResultCard, testResult.ok ? styles.testResultOk : styles.testResultFail]}>
            <Feather name={testResult.ok ? 'check-circle' : 'x-circle'} size={13} color={testResult.ok ? '#4ade80' : '#ef4444'} />
            <Text style={[styles.testResultText, { color: testResult.ok ? '#4ade80' : '#ef4444' }]}>
              {testResult.message}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.testBtn, testing && styles.btnDisabled]}
            activeOpacity={0.8}
            onPress={handleTest}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#737373" />
            ) : (
              <Feather name="zap" size={14} color="#737373" />
            )}
            <Text style={styles.testBtnText}>{testing ? 'Testing...' : 'Test Endpoint'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="check" size={14} color="#fff" />
            )}
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Provider'}</Text>
          </TouchableOpacity>
        </View>
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
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  card: { backgroundColor: '#171717', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  rowLabel: { flex: 1, fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  fieldRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  fieldLabel: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  cardHeaderText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 12 },
  hint: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10, paddingHorizontal: 14, paddingBottom: 10 },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#1f1f1f', borderRadius: 8, margin: 10, marginTop: 0,
  },
  selectValue: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 12 },
  typeMenu: { marginHorizontal: 10, marginBottom: 10, gap: 4 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 8, borderRadius: 8,
    backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  typeOptionActive: { borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)' },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  typeDotActive: { backgroundColor: '#8b5cf6' },
  typeDotInactive: { backgroundColor: '#404040' },
  typeText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  typeTextActive: { color: '#f5f5f5' },
  testResultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1,
  },
  testResultOk: { backgroundColor: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' },
  testResultFail: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' },
  testResultText: { fontFamily: MONO_FONT, fontSize: 11, flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  testBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#171717', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  testBtnText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#8b5cf6',
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: MONO_FONT, color: '#fff', fontSize: 12, fontWeight: '700' },
});
