import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MONO_FONT } from '@/constants/colors';

const FEATURES = [
  {
    icon: 'key' as const,
    title: 'BYOK — Bring Your Own Keys',
    desc: '// your API keys, your data, zero middleman',
  },
  {
    icon: 'cpu' as const,
    title: 'Multi-Agent Orchestration',
    desc: '// configure agents with custom tools & memory',
  },
  {
    icon: 'server' as const,
    title: 'MCP Server Integration',
    desc: '// connect any MCP-compatible tool server',
  },
  {
    icon: 'shield' as const,
    title: '100% Local Storage',
    desc: '// all data stored on-device, never uploaded',
  },
];

const PAGES = [
  { title: 'Why NeuralKey?', icon: 'cpu' as const },
  { title: 'Supported Providers', icon: 'globe' as const },
  { title: 'Get Started', icon: 'arrow-right' as const },
];

export default function FeaturesScreen() {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < PAGES.length - 1) {
      setPage(p => p + 1);
    } else {
      router.push('/(onboarding)/setup');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Feather name="cpu" size={32} color="#8b5cf6" />
        </View>
        <Text style={styles.appName}>NeuralKey</Text>
        <Text style={styles.appSubtitle}>{'// BYOK AI CHAT · POWER USER EDITION'}</Text>
      </View>

      {/* Feature Cards */}
      <View style={styles.featureList}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Feather name={f.icon} size={16} color="#8b5cf6" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === page ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>
            {page < PAGES.length - 1 ? 'Next' : 'Add API Key'}
          </Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.disclaimer}>{'// no account required · works offline · open source'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontFamily: MONO_FONT,
    color: '#f5f5f5',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontFamily: MONO_FONT,
    color: '#737373',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  featureList: {
    flex: 1,
    gap: 2,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
    padding: 8,
    overflow: 'hidden',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontFamily: MONO_FONT,
    color: '#f5f5f5',
    fontSize: 14,
    fontWeight: '700',
  },
  featureDesc: {
    fontFamily: MONO_FONT,
    color: '#737373',
    fontSize: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 999,
    height: 6,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#8b5cf6',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#404040',
  },
  bottom: {
    gap: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: MONO_FONT,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimer: {
    fontFamily: MONO_FONT,
    color: '#525252',
    fontSize: 10,
    textAlign: 'center',
  },
});
