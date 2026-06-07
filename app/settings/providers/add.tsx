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

const PROVIDERS: { type: ProviderType; name: string; placeholder: string }[] = [
  { type: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { type: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
  { type: 'gemini', name: 'Google Gemini', placeholder: 'AIza...' },
  { type: 'custom', name: 'Custom (OpenAI-compatible)', placeholder: 'sk-...' },
];

export default function AddProviderScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { addProvider } = useApp();
  const [type, setType] = useState<ProviderType>('openai');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const selected = PROVIDERS.find(p => p.type === type)!;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Required', 'Please enter your API key.');
      return;
    }
    const providerName = name.trim() || selected.name;
    setLoading(true);
    haptics.medium();
    try {
      await addProvider({ name: providerName, type, apiKey: apiKey.trim(), baseUrl: baseUrl.trim() || undefined, enabled: true });
      haptics.success();
      router.back();
    } catch {
      haptics.error();
      Alert.alert('Error', 'Failed to save provider.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Add Provider</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 20 }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textDim }]}>PROVIDER TYPE</Text>
          <View style={styles.typeGrid}>
            {PROVIDERS.map(p => (
              <Pressable
                key={p.type}
                onPress={() => { haptics.selection(); setType(p.type); }}
                style={({ pressed }) => [
                  styles.typeChip,
                  {
                    backgroundColor: type === p.type ? colors.primaryMuted : colors.card,
                    borderColor: type === p.type ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.typeText, { color: type === p.type ? colors.primary : colors.textMuted }]}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textDim }]}>NAME (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            placeholder={selected.name}
            placeholderTextColor={colors.textFaint}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>API KEY</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            placeholder={selected.placeholder}
            placeholderTextColor={colors.textFaint}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {type === 'custom' && (
            <>
              <Text style={[styles.label, { color: colors.textDim }]}>BASE URL</Text>
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

          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1, marginTop: 20 },
            ]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Provider</Text>}
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
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginTop: 8, marginBottom: 2 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  typeText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
