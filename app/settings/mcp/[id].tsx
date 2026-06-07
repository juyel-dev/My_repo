import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import type { MCPTransport } from '@/types';

const TRANSPORTS: MCPTransport[] = ['SSE', 'WebSocket', 'HTTP', 'STDIO'];

export default function EditMCPScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, updateMCPServer, deleteMCPServer } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const server = state.mcpServers.find(s => s.id === id);
  const [name, setName] = useState(server?.name ?? '');
  const [url, setUrl] = useState(server?.url ?? '');
  const [transport, setTransport] = useState<MCPTransport>(server?.transport ?? 'SSE');

  if (!server) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const handleSave = async () => {
    if (!url.trim() && transport !== 'STDIO') {
      Alert.alert('URL Required', 'Please enter a server URL.');
      return;
    }
    haptics.medium();
    await updateMCPServer(id, { name: name.trim() || server.name, url: url.trim(), transport });
    haptics.success();
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete MCP Server', `Delete "${server.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { haptics.error(); await deleteMCPServer(id); router.back(); },
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
          <Text style={[styles.title, { color: colors.text }]}>MCP Server</Text>
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 20 }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: colors.textDim }]}>NAME</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.textDim }]}>TRANSPORT</Text>
          <View style={styles.transportGrid}>
            {TRANSPORTS.map(t => (
              <Pressable
                key={t}
                onPress={() => { haptics.selection(); setTransport(t); }}
                style={({ pressed }) => [
                  styles.transportChip,
                  {
                    backgroundColor: transport === t ? colors.primaryMuted : colors.card,
                    borderColor: transport === t ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.transportText, { color: transport === t ? colors.primary : colors.textMuted }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textDim }]}>SERVER URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
            value={url}
            onChangeText={setUrl}
            placeholder="https://mcp.example.com/sse"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={[styles.infoBox, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              MCP servers extend your agents with tools like file access, web search, and database queries. The server must implement the Model Context Protocol specification.
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1, marginTop: 20 },
            ]}
          >
            <Text style={styles.saveBtnText}>Save Server</Text>
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
  transportGrid: { flexDirection: 'row', gap: 8 },
  transportChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  transportText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
