import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform, Pressable, ScrollView, StyleSheet, Switch,
  Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';

interface RowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, rightEl, danger }: RowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightEl}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[
        styles.rowIcon,
        { backgroundColor: danger ? colors.destructiveMuted : colors.primaryMuted,
          borderColor: danger ? colors.destructiveBorder : colors.primaryBorder },
      ]}>
        <Feather name={icon} size={15} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.text }]}>{label}</Text>
      {rightEl ?? (
        <View style={styles.rowRight}>
          {value ? <Text style={[styles.rowValue, { color: colors.textDim }]}>{value}</Text> : null}
          {onPress ? <Feather name="chevron-right" size={15} color={colors.textFaint} /> : null}
        </View>
      )}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{title}</Text>
      <View style={styles.sectionCards}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, updateSettings } = useApp();
  const { settings } = state;

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const providersCount = state.providers.filter(p => p.enabled).length;
  const modelsCount = state.models.filter(m => m.enabled).length;
  const agentsCount = state.agents.filter(a => a.enabled).length;
  const mcpCount = state.mcpServers.filter(s => s.enabled).length;

  const toggle = (key: keyof typeof settings) => () => {
    haptics.selection();
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: top }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="AI PROVIDERS">
          <SettingsRow
            icon="key"
            label="Providers"
            value={`${providersCount} active`}
            onPress={() => { haptics.light(); router.push('/settings/providers/index'); }}
          />
          <SettingsRow
            icon="cpu"
            label="Models"
            value={`${modelsCount} enabled`}
            onPress={() => { haptics.light(); router.push('/settings/models'); }}
          />
        </Section>

        <Section title="AGENTS & TOOLS">
          <SettingsRow
            icon="user"
            label="Agents"
            value={`${agentsCount} active`}
            onPress={() => { haptics.light(); router.push('/settings/agents/index'); }}
          />
          <SettingsRow
            icon="server"
            label="MCP Servers"
            value={`${mcpCount} connected`}
            onPress={() => { haptics.light(); router.push('/settings/mcp/index'); }}
          />
        </Section>

        <Section title="PREFERENCES">
          <SettingsRow
            icon="zap"
            label="Streaming Responses"
            rightEl={
              <Switch
                value={settings.streamingEnabled}
                onValueChange={toggle('streamingEnabled')}
                trackColor={{ false: colors.chip, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="database"
            label="Persistent Memory"
            onPress={() => { haptics.light(); router.push('/settings/memory'); }}
            rightEl={
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: settings.persistentMemory ? colors.primary : colors.textDim }]}>
                  {settings.persistentMemory ? 'On' : 'Off'}
                </Text>
                <Feather name="chevron-right" size={15} color={colors.textFaint} />
              </View>
            }
          />
          <SettingsRow
            icon="smartphone"
            label="Haptic Feedback"
            rightEl={
              <Switch
                value={settings.hapticFeedback}
                onValueChange={toggle('hapticFeedback')}
                trackColor={{ false: colors.chip, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </Section>

        <Section title="DATA">
          <SettingsRow
            icon="alert-triangle"
            label="Danger Zone"
            onPress={() => { haptics.warning(); router.push('/settings/danger'); }}
            danger
          />
        </Section>

        <Text style={[styles.version, { color: colors.textFaint }]}>
          NeuralKey v1.0.0 · Built with Expo
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  content: { padding: 16, gap: 8 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 2, marginLeft: 4 },
  sectionCards: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  version: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 16 },
});
