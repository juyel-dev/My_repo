import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';

interface DangerAction {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
  confirmTitle: string;
  confirmMessage: string;
  action: () => Promise<void>;
}

export default function DangerZoneScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const {
    deleteAllConversations, clearAllModels, clearCustomAgents,
    resetAllSettings, clearAllData, state,
  } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const [loading, setLoading] = useState<string | null>(null);

  const ACTIONS: DangerAction[] = [
    {
      id: 'clear_conversations',
      icon: 'message-circle',
      title: 'Clear All Conversations',
      desc: `Delete all ${state.conversations.length} conversation${state.conversations.length !== 1 ? 's' : ''} and their message history permanently.`,
      confirmTitle: 'Clear All Conversations',
      confirmMessage: `This will permanently delete all ${state.conversations.length} conversations. This cannot be undone.`,
      action: async () => {
        await deleteAllConversations();
        haptics.success();
      },
    },
    {
      id: 'clear_models',
      icon: 'cpu',
      title: 'Clear All Providers & Models',
      desc: `Remove all ${state.providers.length} provider${state.providers.length !== 1 ? 's' : ''} and ${state.models.length} model configuration${state.models.length !== 1 ? 's' : ''}.`,
      confirmTitle: 'Clear Providers & Models',
      confirmMessage: 'This will remove all providers and models. You will need to add them again. This cannot be undone.',
      action: async () => {
        await clearAllModels();
        haptics.success();
      },
    },
    {
      id: 'clear_agents',
      icon: 'user',
      title: 'Reset Custom Agents',
      desc: `Delete all custom agents, keeping only the default Assistant.`,
      confirmTitle: 'Reset Custom Agents',
      confirmMessage: 'This will delete all custom agents. The default Assistant will be kept. This cannot be undone.',
      action: async () => {
        await clearCustomAgents();
        haptics.success();
      },
    },
    {
      id: 'reset_settings',
      icon: 'sliders',
      title: 'Reset Settings',
      desc: 'Restore all settings to their default values. Providers and conversations are kept.',
      confirmTitle: 'Reset All Settings',
      confirmMessage: 'This will reset all preferences to defaults. Your providers and conversations will not be affected.',
      action: async () => {
        await resetAllSettings();
        haptics.success();
      },
    },
    {
      id: 'clear_all',
      icon: 'alert-octagon',
      title: 'Factory Reset',
      desc: 'Delete everything: all conversations, providers, models, agents, and settings. Start fresh.',
      confirmTitle: '⚠️ Factory Reset',
      confirmMessage: 'This will permanently delete ALL data including conversations, providers, models, and agents. This CANNOT be undone.',
      action: async () => {
        await clearAllData();
        haptics.error();
        router.replace('/');
      },
    },
  ];

  const handleAction = (action: DangerAction) => {
    haptics.warning();
    Alert.alert(
      action.confirmTitle,
      action.confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.id === 'clear_all' ? 'Reset Everything' : 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setLoading(action.id);
            try {
              await action.action();
            } catch { haptics.error(); }
            finally { setLoading(null); }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Danger Zone</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 20 }]}>
        <View style={[styles.warningBanner, { backgroundColor: colors.destructiveMuted, borderColor: colors.destructiveBorder }]}>
          <Feather name="alert-triangle" size={18} color={colors.destructive} />
          <Text style={[styles.warningText, { color: colors.destructive }]}>
            All actions below are irreversible. Proceed with caution.
          </Text>
        </View>

        {ACTIONS.map(action => (
          <Pressable
            key={action.id}
            onPress={() => handleAction(action)}
            disabled={!!loading}
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: colors.card,
                borderColor: action.id === 'clear_all' ? colors.destructiveBorder : colors.border,
                opacity: pressed || !!loading ? 0.75 : 1,
              },
            ]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.destructiveMuted, borderColor: colors.destructiveBorder }]}>
              {loading === action.id ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Feather name={action.icon} size={16} color={colors.destructive} />
              )}
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.destructive }]}>{action.title}</Text>
              <Text style={[styles.actionDesc, { color: colors.textDim }]}>{action.desc}</Text>
            </View>
            <Feather name="chevron-right" size={15} color={colors.destructive} style={{ opacity: 0.5 }} />
          </Pressable>
        ))}
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 19 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  actionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 17 },
});
