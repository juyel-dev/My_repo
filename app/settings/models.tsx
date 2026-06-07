import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import { CAP_ICONS, CAP_COLORS } from '@/constants/agentConfig';
import type { Capability } from '@/types';

export default function ModelsScreen() {
  const insets = useSafeAreaInsets();
  const { state, toggleModel, deleteModel } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const groupedModels = state.providers.map(p => ({
    provider: p,
    models: state.models.filter(m => m.providerId === p.id),
  })).filter(g => g.models.length > 0);

  const handleDeleteModel = (id: string, name: string) => {
    Alert.alert('Delete Model', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteModel(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>Models</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {groupedModels.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="cpu" size={28} color="#404040" />
            <Text style={styles.emptyTitle}>No models yet</Text>
            <Text style={styles.emptyDesc}>{'// Add an API provider to see available models'}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/settings/providers/')} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>Add Provider</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedModels.map(({ provider, models }) => (
            <View key={provider.id} style={styles.providerGroup}>
              <View style={styles.providerHeader}>
                <View style={[styles.providerDot, provider.enabled ? styles.providerDotOn : styles.providerDotOff]} />
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerMeta}>{models.filter(m => m.enabled).length}/{models.length} enabled</Text>
              </View>
              <View style={styles.modelList}>
                {models.map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <View style={styles.sep} />}
                    <View style={[styles.modelRow, !m.enabled && styles.modelRowDisabled]}>
                      <View style={styles.modelLeft}>
                        <View style={[styles.modelDot, m.enabled ? styles.modelDotOn : styles.modelDotOff]} />
                        <View style={styles.modelInfo}>
                          <Text style={styles.modelName}>{m.name}</Text>
                          <View style={styles.metaRow}>
                            <View style={styles.caps}>
                              {m.capabilities.map(cap => (
                                <View key={cap} style={[styles.capBadge, { backgroundColor: `${CAP_COLORS[cap as Capability]}20` }]}>
                                  <Feather name={CAP_ICONS[cap as Capability]} size={9} color={CAP_COLORS[cap as Capability]} />
                                </View>
                              ))}
                            </View>
                            <Text style={styles.ctx}>{(m.contextLength / 1000).toFixed(0)}K ctx</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.modelActions}>
                        <TouchableOpacity onPress={() => toggleModel(m.id)} hitSlop={8}>
                          <Feather name={m.enabled ? 'toggle-right' : 'toggle-left'} size={22} color={m.enabled ? '#8b5cf6' : '#525252'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteModel(m.id, m.name)} hitSlop={8}>
                          <Feather name="trash-2" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
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
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyTitle: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 15, fontWeight: '600' },
  emptyDesc: { fontFamily: MONO_FONT, color: '#525252', fontSize: 11 },
  addBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', marginTop: 8,
  },
  addBtnText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
  providerGroup: { gap: 8 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  providerDot: { width: 6, height: 6, borderRadius: 3 },
  providerDotOn: { backgroundColor: '#4ade80' },
  providerDotOff: { backgroundColor: '#525252' },
  providerName: { flex: 1, fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  providerMeta: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10 },
  modelList: { backgroundColor: '#171717', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 14 },
  modelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  modelRowDisabled: { opacity: 0.5 },
  modelLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  modelDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  modelDotOn: { backgroundColor: '#8b5cf6' },
  modelDotOff: { backgroundColor: '#404040' },
  modelInfo: { flex: 1 },
  modelName: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  caps: { flexDirection: 'row', gap: 3 },
  capBadge: { width: 16, height: 16, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  ctx: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10 },
  modelActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
