import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  FlatList, Platform, Pressable, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { CapabilityChip } from '@/components/ui/CapabilityChip';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ModelsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state, toggleModel, updateAgent } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const modelsByProvider = state.providers.map(p => ({
    provider: p,
    models: state.models.filter(m => m.providerId === p.id),
  })).filter(g => g.models.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Models</Text>
        <View style={{ width: 34 }} />
      </View>

      <FlatList
        data={modelsByProvider}
        keyExtractor={g => g.provider.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + 20 },
          modelsByProvider.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!modelsByProvider.length}
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.textDim }]}>
              {group.provider.name.toUpperCase()}
            </Text>
            {group.models.map(m => {
              const usedByAgents = state.agents.filter(a => a.modelId === m.id);
              return (
                <View key={m.id} style={[styles.card, { backgroundColor: colors.card, borderColor: m.enabled ? colors.primaryBorder : colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.modelName, { color: colors.text }]}>{m.name}</Text>
                      <Text style={[styles.modelId, { color: colors.textFaint }]}>{m.modelId}</Text>
                      <Text style={[styles.contextLen, { color: colors.textDim }]}>
                        {(m.contextLength / 1000).toFixed(0)}k context
                      </Text>
                    </View>
                    <Switch
                      value={m.enabled}
                      onValueChange={() => { haptics.selection(); toggleModel(m.id); }}
                      trackColor={{ false: colors.chip, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                  <View style={styles.caps}>
                    {m.capabilities.map(cap => (
                      <CapabilityChip key={cap} capability={cap} />
                    ))}
                  </View>
                  {usedByAgents.length > 0 && (
                    <View style={styles.usedBy}>
                      <Feather name="user" size={10} color={colors.textFaint} />
                      <Text style={[styles.usedByText, { color: colors.textFaint }]}>
                        Used by {usedByAgents.map(a => a.name).join(', ')}
                      </Text>
                    </View>
                  )}
                  {m.enabled && usedByAgents.length === 0 && (
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        const agent = state.agents.find(a => a.id === 'default-assistant');
                        if (agent) updateAgent(agent.id, { modelId: m.id });
                      }}
                    >
                      <Text style={[styles.assignText, { color: colors.primary }]}>Use for default agent →</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cpu"
            title="No models yet"
            subtitle="Add a provider to see available models"
          />
        }
      />
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
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 16, gap: 20 },
  group: { gap: 8 },
  groupTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginLeft: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardInfo: { flex: 1, gap: 2 },
  modelName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  modelId: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  contextLen: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  caps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  usedBy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  usedByText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  assignText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
