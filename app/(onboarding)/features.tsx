import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';

const FEATURES = [
  {
    icon: 'cpu' as const,
    title: 'Multiple AI Agents',
    desc: 'Create specialized agents for coding, writing, research, and more — each with unique system prompts and models.',
    color: '#8b5cf6',
  },
  {
    icon: 'key' as const,
    title: 'Bring Your Own Keys',
    desc: 'Connect OpenAI, Anthropic, Google Gemini, or any OpenAI-compatible endpoint. Keys stored only on device.',
    color: '#3b82f6',
  },
  {
    icon: 'activity' as const,
    title: 'Real-time Streaming',
    desc: 'Watch responses appear word by word with smooth streaming. No waiting for complete responses.',
    color: '#4ade80',
  },
  {
    icon: 'server' as const,
    title: 'MCP Tool Support',
    desc: 'Connect Model Context Protocol servers to give your agents access to tools, APIs, and external data.',
    color: '#fbbf24',
  },
  {
    icon: 'database' as const,
    title: 'Persistent Memory',
    desc: 'Conversations are saved locally. Your chat history stays private and always available offline.',
    color: '#f97316',
  },
];

export default function FeaturesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>What's Inside</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {FEATURES.map((f, i) => (
          <Animated.View
            key={f.title}
            entering={FadeInDown.delay(i * 80).duration(400)}
          >
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: `${f.color}18`, borderColor: `${f.color}35` }]}>
                <Feather name={f.icon} size={22} color={f.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{f.desc}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 16, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => { haptics.medium(); router.push('/(onboarding)/setup'); }}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.btnText}>Set Up First Provider</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </View>
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
  backBtn: { width: 34, alignItems: 'flex-start' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 8,
  },
  btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
