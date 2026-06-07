import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';

export default function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, updateSettings } = useApp();
  const { settings } = state;
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalMessages = state.conversations.reduce((s, c) => s + c.messages.length, 0);
  const totalConvs = state.conversations.length;

  const toggle = (key: 'persistentMemory' | 'sessionMemory' | 'autoSummarize') => {
    haptics.selection();
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Memory & Storage</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 20 }]}>
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>{totalConvs}</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Conversations</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>{totalMessages}</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Messages</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>{state.providers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textDim }]}>Providers</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textDim }]}>MEMORY SETTINGS</Text>

        {[
          { key: 'persistentMemory' as const, icon: 'database' as const, title: 'Persistent Memory', desc: 'Save conversation history to local storage across app restarts' },
          { key: 'sessionMemory' as const, icon: 'clock' as const, title: 'Session Memory', desc: 'Remember context within the current session' },
          { key: 'autoSummarize' as const, icon: 'file-text' as const, title: 'Auto-Summarize', desc: 'Automatically generate summaries for long conversations' },
        ].map(({ key, icon, title, desc }) => (
          <View key={key} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
              <Feather name={icon} size={15} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.rowDesc, { color: colors.textDim }]}>{desc}</Text>
            </View>
            <Switch
              value={settings[key]}
              onValueChange={() => toggle(key)}
              trackColor={{ false: colors.chip, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}

        <View style={[styles.infoBox, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
          <Feather name="shield" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            All data is stored locally on your device using AsyncStorage. Nothing is sent to any server other than your chosen AI provider.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  content: { padding: 16, gap: 10 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, height: 36, marginHorizontal: 8 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginTop: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 17 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});
