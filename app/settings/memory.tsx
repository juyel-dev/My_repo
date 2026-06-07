import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { MONO_FONT } from '@/constants/colors';

function ToggleRow({ label, desc, value, onToggle }: {
  label: string; desc: string; value: boolean; onToggle: () => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <TouchableOpacity onPress={onToggle} hitSlop={8}>
        <Feather name={value ? 'toggle-right' : 'toggle-left'} size={24} color={value ? '#8b5cf6' : '#525252'} />
      </TouchableOpacity>
    </View>
  );
}

export default function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const { state, updateSettings } = useApp();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const s = state.settings;

  const toggle = (key: keyof typeof s) => {
    updateSettings({ [key]: !s[key] });
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#a1a1a1" />
        </TouchableOpacity>
        <Text style={styles.title}>{'Memory & Personalization'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Memory */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// MEMORY'}</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Persistent Memory"
              desc="// retains context across sessions"
              value={s.persistentMemory}
              onToggle={() => toggle('persistentMemory')}
            />
            <View style={styles.sep} />
            <ToggleRow
              label="Session Memory"
              desc="// active within current session only"
              value={s.sessionMemory}
              onToggle={() => toggle('sessionMemory')}
            />
            <View style={styles.sep} />
            <ToggleRow
              label="Auto-Summarize"
              desc="// compresses old context automatically"
              value={s.autoSummarize}
              onToggle={() => toggle('autoSummarize')}
            />
          </View>
        </View>

        {/* UX */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{'// EXPERIENCE'}</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Haptic Feedback"
              desc="// vibration on key interactions"
              value={s.hapticFeedback}
              onToggle={() => toggle('hapticFeedback')}
            />
            <View style={styles.sep} />
            <ToggleRow
              label="Streaming Responses"
              desc="// show text as it's generated"
              value={s.streamingEnabled}
              onToggle={() => toggle('streamingEnabled')}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Feather name="shield" size={13} color="#8b5cf6" />
          <Text style={styles.infoText}>
            {'All memory data is stored locally on your device. Nothing is sent to external servers without your API keys being used for AI requests.'}
          </Text>
        </View>
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
  content: { padding: 16, gap: 24, paddingBottom: 32 },
  section: { gap: 8 },
  sectionLabel: { fontFamily: MONO_FONT, color: '#8b5cf6', fontSize: 10, letterSpacing: 2 },
  card: { backgroundColor: '#171717', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  toggleLeft: { flex: 1, gap: 3 },
  toggleLabel: { fontFamily: MONO_FONT, color: '#f5f5f5', fontSize: 14 },
  toggleDesc: { fontFamily: MONO_FONT, color: '#525252', fontSize: 10 },
  sep: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  infoCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)', padding: 14,
  },
  infoText: { fontFamily: MONO_FONT, color: '#737373', fontSize: 11, flex: 1, lineHeight: 16 },
});
