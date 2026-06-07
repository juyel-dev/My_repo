import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  badge?: string | number;
  badgeColor?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingsItem({ icon, label, badge, badgeColor = '#8b5cf6', onPress, danger }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Feather name={icon} size={14} color={danger ? '#ef4444' : '#8b5cf6'} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      <View style={styles.settingRight}>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
        <Feather name="chevron-right" size={14} color="#525252" />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const enabledProviders = state.providers.filter(p => p.enabled).length;
  const enabledModels = state.models.filter(m => m.enabled).length;
  const enabledAgents = state.agents.filter(a => a.enabled).length;
  const connectedMCP = state.mcpServers.filter(s => s.status === 'connected').length;

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.headerLeft}>
          <Feather name="settings" size={14} color="#8b5cf6" />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <Text style={styles.headerVersion}>v1.0.0</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* API & Models */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// AI INFRASTRUCTURE'}</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="globe"
              label="API Providers"
              badge={enabledProviders > 0 ? enabledProviders : undefined}
              onPress={() => router.push('/settings/providers/')}
            />
            <View style={styles.rowSep} />
            <SettingsItem
              icon="cpu"
              label="Models"
              badge={enabledModels > 0 ? enabledModels : undefined}
              onPress={() => router.push('/settings/models')}
            />
          </View>
        </View>

        {/* Agents */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// AGENTS & TOOLS'}</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="user"
              label="Agents"
              badge={enabledAgents}
              onPress={() => router.push('/settings/agents/')}
            />
            <View style={styles.rowSep} />
            <SettingsItem
              icon="server"
              label="MCP Servers"
              badge={connectedMCP > 0 ? `${connectedMCP} connected` : undefined}
              badgeColor="#4ade80"
              onPress={() => router.push('/settings/mcp/')}
            />
          </View>
        </View>

        {/* Personalization */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// PERSONALIZATION'}</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="sliders"
              label="Memory & Personalization"
              onPress={() => router.push('/settings/memory')}
            />
          </View>
        </View>

        {/* Danger */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: '#ef4444' }]}>{'// DANGER ZONE'}</Text>
          <View style={[styles.card, styles.dangerCard]}>
            <SettingsItem
              icon="alert-triangle"
              label="Danger Zone"
              onPress={() => router.push('/settings/danger')}
              danger
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{'// NeuralKey v1.0.0 · all data stored locally'}</Text>
          <Text style={styles.footerText}>{'// no telemetry · no accounts · open source'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 18, fontWeight: '700' },
  headerVersion: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 24, paddingBottom: 32 },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10,
    letterSpacing: 2, paddingLeft: 4,
  },
  card: {
    borderRadius: 14, backgroundColor: '#171717',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  dangerCard: { borderColor: 'rgba(239,68,68,0.15)' },
  rowSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 52 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  settingIconDanger: { backgroundColor: 'rgba(239,68,68,0.12)' },
  settingLabel: { flex: 1, fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14 },
  settingLabelDanger: { color: '#ef4444' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontFamily: MONO_FONT, fontSize: 10, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 4, paddingTop: 8 },
  footerText: { fontFamily: MONO_FONT, color: '#404040', fontSize: 10 },
});
