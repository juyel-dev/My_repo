import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import type { MCPTransport } from '@/types';

const TRANSPORT_COLORS: Record<MCPTransport, string> = {
  SSE: '#8b5cf6', WebSocket: '#3b82f6', HTTP: '#fbbf24', STDIO: '#4ade80',
};

export default function MCPScreen() {
  const insets = useSafeAreaInsets();
  const { state, toggleMCPServer, deleteMCPServer } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [showAdd, setShowAdd] = useState(false);

  const connected = state.mcpServers.filter(s => s.status === 'connected').length;

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete MCP Server', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMCPServer(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>MCP Servers</Text>
        <TouchableOpacity onPress={() => router.push('/settings/mcp/add')} style={styles.addBtn} activeOpacity={0.8}>
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {connected > 0 && (
        <View style={styles.statusBar}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{connected} server{connected > 1 ? 's' : ''} connected</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{'// MCP SERVERS'}</Text>

        {state.mcpServers.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="server" size={28} color="#404040" />
            <Text style={styles.emptyTitle}>No MCP servers</Text>
            <Text style={styles.emptyDesc}>{'// Connect tool servers to extend AI capabilities'}</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => router.push('/settings/mcp/add')} activeOpacity={0.8}>
              <Feather name="plus" size={14} color="#8b5cf6" />
              <Text style={styles.addFirstBtnText}>Add MCP Server</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {state.mcpServers.map(s => (
              <View key={s.id} style={[styles.card, !s.enabled && styles.cardDisabled]}>
                <View style={[styles.accent, s.enabled && styles.accentActive]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.nameArea}>
                      <View style={styles.nameLine}>
                        <Text style={styles.serverName}>{s.name}</Text>
                        <View style={[styles.transportBadge, { backgroundColor: `${TRANSPORT_COLORS[s.transport]}15` }]}>
                          <Text style={[styles.transportText, { color: TRANSPORT_COLORS[s.transport] }]}>{s.transport}</Text>
                        </View>
                      </View>
                      <Text style={styles.serverUrl} numberOfLines={1}>{s.url}</Text>
                      <View style={styles.statusLine}>
                        <View style={[styles.statusDot2, s.status === 'connected' ? styles.statusDotOn : styles.statusDotOff]} />
                        <Text style={[styles.serverStatus, s.status === 'connected' ? styles.statusOn : styles.statusOff]}>
                          {s.status === 'connected' ? 'Connected' : 'Disconnected'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => toggleMCPServer(s.id)} hitSlop={8}>
                        <Feather name={s.enabled ? 'toggle-right' : 'toggle-left'} size={22} color={s.enabled ? '#8b5cf6' : '#525252'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push(`/settings/mcp/${s.id}`)} hitSlop={8}>
                        <Feather name="edit-2" size={14} color="#737373" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(s.id, s.name)} hitSlop={8}>
                        <Feather name="trash-2" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/settings/mcp/add')} activeOpacity={0.8}>
          <Feather name="plus" size={14} color="#8b5cf6" />
          <Text style={styles.addMoreText}>Add MCP Server</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Active server selector */}
      <View style={styles.activeBar}>
        <View style={styles.activeLeft}>
          <Feather name="star" size={12} color="#8b5cf6" />
          <Text style={styles.activeLabel}>{'// Active MCP Server'}</Text>
        </View>
        <TouchableOpacity style={styles.activePicker} activeOpacity={0.7}>
          <Text style={styles.activePickerText}>
            {state.mcpServers.find(s => s.enabled && s.status === 'connected')?.name ?? 'None'}
          </Text>
          <Feather name="chevron-down" size={14} color="#737373" />
        </TouchableOpacity>
      </View>
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
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  statusText: { fontFamily: MONO_FONT, color: '#4ade80', fontSize: 11 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyTitle: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 15, fontWeight: '600' },
  emptyDesc: { fontFamily: MONO_FONT, color: '#525252', fontSize: 11 },
  addFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', marginTop: 8,
  },
  addFirstBtnText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
  list: { gap: 8 },
  card: {
    backgroundColor: '#171717', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', overflow: 'hidden',
  },
  cardDisabled: { opacity: 0.5 },
  accent: { width: 3, backgroundColor: 'transparent' },
  accentActive: { backgroundColor: '#8b5cf6' },
  cardBody: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nameArea: { flex: 1, gap: 3 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serverName: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14, fontWeight: '600' },
  transportBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  transportText: { fontFamily: MONO_FONT, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  serverUrl: { fontFamily: MONO_FONT, color: '#737373', fontSize: 11 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot2: { width: 5, height: 5, borderRadius: 2.5 },
  statusDotOn: { backgroundColor: '#4ade80' },
  statusDotOff: { backgroundColor: '#ef4444' },
  serverStatus: { fontFamily: MONO_FONT, fontSize: 10 },
  statusOn: { color: '#4ade80' },
  statusOff: { color: '#ef4444' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderStyle: 'dashed',
  },
  addMoreText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
  activeBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0d0d0d',
  },
  activeLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' },
  activePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#171717', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  activePickerText: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13 },
});
