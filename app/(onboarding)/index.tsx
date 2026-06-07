import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MONO_FONT } from '@/constants/colors';

export default function LandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topSection}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Feather name="cpu" size={14} color="#8b5cf6" />
          </View>
          <Text style={styles.logoText}>neuralkey</Text>
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerLine}>───────────────────────────────</Text>
        </View>

        <View style={styles.taglineSection}>
          <Text style={styles.taglineComment}>// Your keys. Your models. Your data.</Text>
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerLine}>───────────────────────────────</Text>
        </View>

        <View style={styles.descSection}>
          <Text style={styles.desc}>A personal, private AI chat client.</Text>
          <Text style={styles.desc}>Bring your own API keys.</Text>
          <Text style={styles.desc}>No middleman. No telemetry.</Text>
        </View>

        <View style={styles.divider}>
          <Text style={styles.dividerLine}>───────────────────────────────</Text>
        </View>

        <View style={styles.featRow}>
          <View style={styles.feat}>
            <Feather name="shield" size={10} color="#8b5cf6" />
            <Text style={styles.featText}>Private</Text>
          </View>
          <View style={styles.feat}>
            <Feather name="wifi-off" size={10} color="#8b5cf6" />
            <Text style={styles.featText}>Offline</Text>
          </View>
          <View style={styles.feat}>
            <Feather name="code" size={10} color="#8b5cf6" />
            <Text style={styles.featText}>Open</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(onboarding)/features')}
        >
          <Text style={styles.primaryBtnText}>{'// Get Started →'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace('/(tabs)')}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>{'// Already configured? → Open Chat'}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 · Personal Build</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingTop: Platform.OS === 'web' ? 67 : 48,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  logoText: {
    fontFamily: MONO_FONT,
    color: '#f5f5f5',
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '700',
  },
  divider: {
    width: '100%',
    alignItems: 'center',
  },
  dividerLine: {
    fontFamily: MONO_FONT,
    color: 'rgba(255,255,255,0.08)',
    fontSize: 10,
  },
  taglineSection: {
    alignItems: 'center',
  },
  taglineComment: {
    fontFamily: MONO_FONT,
    color: '#8b5cf6',
    fontSize: 11,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  descSection: {
    alignItems: 'center',
    gap: 4,
  },
  desc: {
    fontFamily: MONO_FONT,
    color: 'rgba(245,245,245,0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  featRow: {
    flexDirection: 'row',
    gap: 20,
  },
  feat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featText: {
    fontFamily: MONO_FONT,
    color: '#737373',
    fontSize: 10,
    letterSpacing: 1,
  },
  bottomSection: {
    paddingBottom: 32,
    gap: 16,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: MONO_FONT,
    color: '#8b5cf6',
    fontSize: 13,
    letterSpacing: 1,
  },
  secondaryBtn: {
    padding: 8,
  },
  secondaryBtnText: {
    fontFamily: MONO_FONT,
    color: '#737373',
    fontSize: 11,
  },
  version: {
    fontFamily: MONO_FONT,
    color: 'rgba(115,115,115,0.5)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
