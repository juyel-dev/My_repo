import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  FlatList, Platform, Pressable, StyleSheet, Switch, Text, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { EmptyState } from '@/components/ui/EmptyState';
import { PROVIDER_ICONS } from '@/constants/agentConfig';
import type { Provider } from '@/types';

function ProviderRow({ item, index }: { item: Provider; index: number }) {
  const colors = useColors();
  const haptics = useHaptics();
  const { toggleProvider } = useApp();
  const icon = PROVIDER_ICONS[item.type] ?? 'key';

  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 50).duration(300) : undefined}>
      <Pressable
        onPress={() => { haptics.light(); router.push(`/settings/providers/${item.id}`); }}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
          <Feather name={icon} size={16} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.type, { color: colors.textDim }]}>
            {item.type} · {item.apiKey.slice(0, 6)}•••
          </Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => { haptics.selection(); toggleProvider(item.id); }}
          trackColor={{ false: colors.chip, true: colors.primary }}
          thumbColor="#fff"
        />
        <Feather name="chevron-right" size={15} color={colors.textFaint} />
      </Pressable>
    </Animated.View>
  );
}

export default function ProvidersScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();
  const { state } = useApp();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Providers</Text>
        <Pressable
          onPress={() => { haptics.medium(); router.push('/settings/providers/add'); }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={state.providers}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => <ProviderRow item={item} index={index} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottom + 20 },
          state.providers.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="key"
            title="No providers yet"
            subtitle="Add an OpenAI, Anthropic, or Gemini API key to get started"
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!state.providers.length}
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
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  addBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  type: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
