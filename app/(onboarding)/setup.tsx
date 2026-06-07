import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { ProviderType } from '@/types';

const PROVIDERS: { type: ProviderType; name: string; placeholder: string; url: string }[] = [
  { type: 'openai', name: 'OpenAI', placeholder: 'sk-••••••••••••••••••••••••••••••••', url: 'https://api.openai.com/v1' },
  { type: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-••••••••••••••••••••••••••', url: 'https://api.anthropic.com' },
  { type: 'gemini', name: 'Google Gemini', placeholder: 'AIza••••••••••••••••••••••••••', url: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { type: 'custom', name: 'Custom / Local', placeholder: 'sk-••••••• or leave blank', url: 'http://localhost:11434/v1' },
];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { addProvider, completeOnboarding } = useApp();
  const [selected, setSelected] = useState<ProviderType>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const selectedProvider = PROVIDERS.find(p => p.type === selected)!;

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (apiKey.trim()) {
        await addProvider({
          name: selected === 'custom' ? (customName.trim() || 'Custom Provider') : selectedProvider.name,
          type: selected,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || selectedProvider.url,
          enabled: true,
        });
      }
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Add API Key</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>{'// SELECT PROVIDER'}</Text>

        {/* Provider tabs */}
        <View style={styles.providerGrid}>
          {PROVIDERS.map(p => (
            <TouchableOpacity
              key={p.type}
              style={[styles.providerChip, selected === p.type && styles.providerChipActive]}
              onPress={() => { setSelected(p.type); setApiKey(''); setBaseUrl(''); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.providerChipText, selected === p.type && styles.providerChipTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom provider name */}
        {selected === 'custom' && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{'// PROVIDER NAME'}</Text>
            <View style={styles.inputRow}>
              <Feather name="tag" size={14} color="#737373" />
              <TextInput
                style={styles.input}
                placeholder="e.g. My Local LLM"
                placeholderTextColor="#525252"
                value={customName}
                onChangeText={setCustomName}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        {/* API Key */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{'// API KEY'}</Text>
          <View style={styles.inputRow}>
            <Feather name="key" size={14} color="#737373" />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={selectedProvider.placeholder}
              placeholderTextColor="#525252"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowKey(v => !v)} hitSlop={8}>
              <Feather name={showKey ? 'eye-off' : 'eye'} size={14} color="#737373" />
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldHint}>// stored locally on-device only · never transmitted</Text>
        </View>

        {/* Base URL (optional) */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{'// BASE URL (OPTIONAL)'}</Text>
          <View style={styles.inputRow}>
            <Feather name="link" size={14} color="#737373" />
            <TextInput
              style={styles.input}
              placeholder={selectedProvider.url}
              placeholderTextColor="#525252"
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          <Text style={styles.fieldHint}>// leave blank to use default endpoint</Text>
        </View>

        <View style={styles.infoCard}>
          <Feather name="shield" size={12} color="#8b5cf6" />
          <Text style={styles.infoText}>Your API key is stored locally and never sent to NeuralKey servers. All AI requests go directly from your device to the provider.</Text>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 24 }]}>
        <TouchableOpacity
          style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.continueBtnText}>
            {loading ? '// Saving...' : apiKey.trim() ? '// Save & Continue' : '// Continue without key'}
          </Text>
          {!loading && <Feather name="arrow-right" size={16} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#171717',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14, fontWeight: '700',
  },
  skipBtn: { padding: 4 },
  skipText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20 },
  sectionLabel: {
    fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  providerChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#171717', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  providerChipActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.5)',
  },
  providerChipText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  providerChipTextActive: { color: '#8b5cf6' },
  field: { gap: 8 },
  fieldLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1f1f1f', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  input: {
    flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 12,
  },
  fieldHint: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10 },
  infoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
    padding: 12,
  },
  infoText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 11, flex: 1, lineHeight: 16 },
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  continueBtn: {
    height: 48, borderRadius: 12, backgroundColor: '#8b5cf6',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: { fontFamily: MONO_FONT, color: '#fff', fontSize: 13, fontWeight: '700' },
});
