import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';
import { PROVIDER_ICONS } from '@/constants/agentConfig';

export default function ProvidersScreen() {
  const insets = useSafeAreaInsets();
  const { state, toggleProvider, deleteProvider } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Provider', `Remove ${name} and its models?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProvider(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>API Providers</Text>
        <TouchableOpacity onPress={() => router.push('/settings/providers/add')} style={styles.addBtn} activeOpacity={0.8}>
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>{'// CONNECTED PROVIDERS'}</Text>

        {state.providers.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="globe" size={28} color="#404040" />
            </View>
            <Text style={styles.emptyTitle}>No providers yet</Text>
            <Text style={styles.emptyDesc}>{'// Add an API provider to start chatting'}</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => router.push('/settings/providers/add')} activeOpacity={0.8}>
              <Feather name="plus" size={14} color="#8b5cf6" />
              <Text style={styles.addFirstBtnText}>Add Provider</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {state.providers.map(p => {
              const modelCount = state.models.filter(m => m.providerId === p.id).length;
              const enabledCount = state.models.filter(m => m.providerId === p.id && m.enabled).length;
              return (
                <View key={p.id} style={[styles.card, !p.enabled && styles.cardDisabled]}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.provIcon, !p.enabled && styles.provIconDisabled]}>
                      <Feather name={PROVIDER_ICONS[p.type]} size={14} color={p.enabled ? '#8b5cf6' : '#525252'} />
                    </View>
                    <View style={styles.provInfo}>
                      <View style={styles.provNameRow}>
                        <Text style={styles.provName}>{p.name}</Text>
                        <View style={[styles.statusDot, p.enabled ? styles.statusOn : styles.statusOff]} />
                        <Text style={[styles.statusText, p.enabled ? styles.statusTextOn : styles.statusTextOff]}>
                          {p.enabled ? 'Active' : 'Disabled'}
                        </Text>
                      </View>
                      <Text style={styles.provMeta}>{p.type} · {enabledCount}/{modelCount} models</Text>
                      <Text style={styles.provKey} numberOfLines={1}>
                        {p.apiKey.slice(0, 8)}{'•'.repeat(12)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.toggleBtn}
                      onPress={() => toggleProvider(p.id)}
                      hitSlop={8}
                    >
                      <Feather name={p.enabled ? 'toggle-right' : 'toggle-left'} size={20} color={p.enabled ? '#8b5cf6' : '#525252'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push(`/settings/providers/${p.id}`)}
                      hitSlop={8}
                      style={styles.editBtn}
                    >
                      <Feather name="edit-2" size={14} color="#737373" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p.id, p.name)} hitSlop={8}>
                      <Feather name="trash-2" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/settings/providers/add')} activeOpacity={0.8}>
          <Feather name="plus" size={14} color="#8b5cf6" />
          <Text style={styles.addMoreText}>Add Another Provider</Text>
        </TouchableOpacity>
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
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: { fontFamily: MONO_FONT, color: '#a1a1a1', fontSize: 15, fontWeight: '600' },
  emptyDesc: { fontFamily: MONO_FONT, color: '#525252', fontSize: 11 },
  addFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', marginTop: 8,
  },
  addFirstBtnText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
  list: { gap: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#171717', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14, gap: 12,
  },
  cardDisabled: { opacity: 0.6 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  provIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  provIconDisabled: { backgroundColor: '#262626' },
  provInfo: { flex: 1, gap: 2 },
  provNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  provName: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 13, fontWeight: '600' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusOn: { backgroundColor: '#4ade80' },
  statusOff: { backgroundColor: '#525252' },
  statusText: { fontFamily: MONO_FONT, fontSize: 10 },
  statusTextOn: { color: '#4ade80' },
  statusTextOff: { color: '#525252' },
  provMeta: { fontFamily: MONO_FONT, color: '#737373', fontSize: 10 },
  provKey: { fontFamily: MONO_FONT, color: '#404040', fontSize: 10 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleBtn: { padding: 4 },
  editBtn: { padding: 4 },
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
    borderStyle: 'dashed',
  },
  addMoreText: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 13 },
});
