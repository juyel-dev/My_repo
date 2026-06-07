import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';

export default function EditProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, updateProvider, deleteProvider } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const provider = state.providers.find(p => p.id === id);
  const [name, setName] = useState(provider?.name ?? '');
  const [apiKey, setApiKey] = useState(provider?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? '');
  const [saving, setSaving] = useState(false);

  if (!provider) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const relatedModels = state.models.filter(m => m.providerId === id);

  const handleSave = async () => {
    if (!apiKey.trim()) { Alert.alert('API Key Required'); return; }
    setSaving(true);
    haptics.medium();
    try {
      await updateProvider(id, { name: name.trim() || provider.name, apiKey: apiKey.trim(), baseUrl: baseUrl.trim() || undefined });
      haptics.success();
      router.back();
    } catch { haptics.error(); } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Provider', `Delete "${provider.name}" and all its models?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          haptics.error();
          await deleteProvider(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{provider.name}</Text>
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 20 }]}>
          <Text style={[styles.label, { color: colors.textDim }]}>NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder={provider.name}
            placeholderTextColor={colors.textFaint}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>API KEY</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="API key"
            placeholderTextColor={colors.textFaint}
          />

          {provider.type === 'custom' && (
            <>
              <Text style={[styles.label, { color: colors.textDim }]}>BASE URL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                value={baseUrl}
                onChangeText={setBaseUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://..."
                placeholderTextColor={colors.textFaint}
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.textDim }]}>MODELS ({relatedModels.length})</Text>
          {relatedModels.map(m => (
            <View key={m.id} style={[styles.modelRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="cpu" size={13} color={colors.textDim} />
              <Text style={[styles.modelName, { color: colors.text }]}>{m.name}</Text>
              <Text style={[styles.modelId, { color: colors.textFaint }]}>{m.modelId}</Text>
            </View>
          ))}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed || saving ? 0.7 : 1, marginTop: 24 },
            ]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  modelName: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  modelId: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
