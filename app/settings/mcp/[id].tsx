import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { MCPTransport } from '@/types';

const TRANSPORTS: MCPTransport[] = ['SSE', 'WebSocket', 'HTTP', 'STDIO'];

const DEFAULT_MCP = {
  name: '', transport: 'SSE' as MCPTransport, url: '', enabled: true,
};

export default function MCPEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, addMCPServer, updateMCPServer, deleteMCPServer } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const isNew = id === 'add';
  const existing = isNew ? null : state.mcpServers.find(s => s.id === id);
  const init = existing ?? DEFAULT_MCP;

  const [name, setName] = useState(init.name);
  const [transport, setTransport] = useState<MCPTransport>(init.transport);
  const [url, setUrl] = useState(init.url);
  const [enabled, setEnabled] = useState(init.enabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Server name is required.'); return; }
    if (!url.trim()) { Alert.alert('Error', 'URL is required.'); return; }
    setSaving(true);
    try {
      if (isNew) {
        await addMCPServer({ name: name.trim(), transport, url: url.trim(), enabled });
      } else {
        await updateMCPServer(id, { name: name.trim(), transport, url: url.trim(), enabled });
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete MCP Server', `Remove "${existing?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMCPServer(id); router.back(); } },
    ]);
  };

  const urlPlaceholders: Record<MCPTransport, string> = {
    SSE: 'https://mcp.example.com/sse',
    WebSocket: 'wss://api.example.com/mcp',
    HTTP: 'https://mcp.example.com/api',
    STDIO: '/usr/bin/mcp-server',
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? 'Add MCP Server' : 'Edit MCP Server'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Basic */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// BASIC'}</Text>
          <View style={styles.rowItem}>
            <Feather name="settings" size={13} color="#8b5cf6" />
            <Text style={styles.rowLabel}>Enable this server</Text>
            <TouchableOpacity onPress={() => setEnabled(v => !v)} hitSlop={8}>
              <Feather name={enabled ? 'toggle-right' : 'toggle-left'} size={24} color={enabled ? '#8b5cf6' : '#525252'} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>SERVER NAME</Text>
            <View style={styles.inputRow}>
              <Feather name="server" size={13} color="#737373" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. filesystem-mcp"
                placeholderTextColor="#525252"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Transport */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// TRANSPORT TYPE'}</Text>
          <View style={styles.transportGrid}>
            {TRANSPORTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.transportOption, transport === t && styles.transportOptionActive]}
                onPress={() => setTransport(t)}
                activeOpacity={0.7}
              >
                <View style={[styles.transportDot, transport === t ? styles.transportDotActive : styles.transportDotInactive]} />
                <Text style={[styles.transportText, transport === t && styles.transportTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* URL */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// ENDPOINT / PATH'}</Text>
          <View style={styles.inputRow}>
            <Feather name="link" size={13} color="#737373" />
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder={urlPlaceholders[transport]}
              placeholderTextColor="#525252"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={transport === 'STDIO' ? 'default' : 'url'}
            />
          </View>
        </View>

        {/* Authentication */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{'// AUTHENTICATION (OPTIONAL)'}</Text>
          <View style={styles.inputRow}>
            <Feather name="key" size={13} color="#737373" />
            <TextInput
              style={styles.input}
              placeholder="Bearer token or API key..."
              placeholderTextColor="#525252"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.hint}>// leave blank for unauthenticated connections</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.testBtn} activeOpacity={0.8}>
            <Feather name="zap" size={14} color="#737373" />
            <Text style={styles.testBtnText}>Test Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveFullBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <Feather name="check" size={14} color="#fff" />
            <Text style={styles.saveFullBtnText}>{saving ? 'Saving...' : 'Save Server'}</Text>
          </TouchableOpacity>
        </View>

        {!isNew && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Feather name="trash-2" size={14} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Delete Server</Text>
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
    borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  cardLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2, padding: 14, paddingBottom: 8 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  rowLabel: { flex: 1, fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  field: { paddingHorizontal: 14, paddingBottom: 12, gap: 6 },
  fieldLabel: { fontFamily: MONO_FONT, color: '#737373', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 12 },
  hint: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10, paddingHorizontal: 14, paddingBottom: 10 },
  transportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14, paddingTop: 0 },
  transportOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  transportOptionActive: { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.4)' },
  transportDot: { width: 6, height: 6, borderRadius: 3 },
  transportDotActive: { backgroundColor: '#8b5cf6' },
  transportDotInactive: { backgroundColor: '#404040' },
  transportText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  transportTextActive: { color: '#f5f5f5' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  testBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#171717', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  testBtnText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 12 },
  saveFullBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#8b5cf6',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveFullBtnText: { fontFamily: MONO_FONT, color: '#fff', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
  },
  deleteBtnText: { fontFamily: MONO_FONT, color: '#ef4444', fontSize: 13, fontWeight: '600' },
});
