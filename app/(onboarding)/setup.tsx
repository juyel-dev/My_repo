import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import type { ProviderType } from '@/types';

const PROVIDERS = [
  { type: 'openai' as ProviderType, name: 'OpenAI', placeholder: 'sk-...', hint: 'platform.openai.com/api-keys' },
  { type: 'anthropic' as ProviderType, name: 'Anthropic', placeholder: 'sk-ant-...', hint: 'console.anthropic.com' },
  { type: 'gemini' as ProviderType, name: 'Google Gemini', placeholder: 'AIza...', hint: 'aistudio.google.com/apikey' },
  { type: 'custom' as ProviderType, name: 'Custom / OpenAI-Compatible', placeholder: 'sk-...', hint: 'Any OpenAI-compatible endpoint' },
];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { addProvider, completeOnboarding } = useApp();
  const [selectedType, setSelectedType] = useState<ProviderType>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const selected = PROVIDERS.find(p => p.type === selectedType)!;

  const handleSkip = async () => {
    haptics.light();
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleContinue = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your API key to continue.');
      return;
    }
    if (selectedType === 'custom' && !customName.trim()) {
      Alert.alert('Name Required', 'Please give your custom provider a name.');
      return;
    }
    setLoading(true);
    haptics.medium();
    try {
      const name = selectedType === 'custom' ? customName : selected.name;
      await addProvider({
        name,
        type: selectedType,
        apiKey: apiKey.trim(),
        baseUrl: selectedType === 'custom' ? baseUrl.trim() : undefined,
        enabled: true,
      });
      await completeOnboarding();
      haptics.success();
      router.replace('/(tabs)');
    } catch {
      haptics.error();
      Alert.alert('Error', 'Failed to save provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add AI Provider</Text>
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={[styles.skipText, { color: colors.textDim }]}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>CHOOSE PROVIDER</Text>
          <View style={styles.providerGrid}>
            {PROVIDERS.map(p => (
              <Pressable
                key={p.type}
                onPress={() => { haptics.selection(); setSelectedType(p.type); }}
                style={({ pressed }) => [
                  styles.providerChip,
                  {
                    backgroundColor: selectedType === p.type ? colors.primaryMuted : colors.card,
                    borderColor: selectedType === p.type ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.providerChipText,
                    { color: selectedType === p.type ? colors.primary : colors.textMuted },
                  ]}
                >
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedType === 'custom' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textDim }]}>PROVIDER NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. My LLM Server"
                placeholderTextColor={colors.textFaint}
                value={customName}
                onChangeText={setCustomName}
              />
            </>
          )}

          <Text style={[styles.sectionLabel, { color: colors.textDim }]}>API KEY</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
            placeholder={selected.placeholder}
            placeholderTextColor={colors.textFaint}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="visible-password"
          />
          <Text style={[styles.hint, { color: colors.textFaint }]}>
            Get your key at {selected.hint}
          </Text>

          {selectedType === 'custom' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textDim }]}>BASE URL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                placeholder="https://api.example.com/v1"
                placeholderTextColor={colors.textFaint}
                value={baseUrl}
                onChangeText={setBaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          <View style={[styles.privacyNote, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
            <Feather name="shield" size={14} color={colors.primary} />
            <Text style={[styles.privacyText, { color: colors.textMuted }]}>
              Your API key is stored only on this device. It is never sent to any server other than your chosen AI provider.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottom + 16, backgroundColor: colors.background }]}>
          <Pressable
            onPress={handleContinue}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>Save and Continue</Text>
                <Feather name="check" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
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
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  skipText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  content: { padding: 20, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  providerChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4 },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  privacyText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 8,
  },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
