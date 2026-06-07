import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Platform, Pressable, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, useAnimatedStyle,
  useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';

function PulsingOrb({ colors }: { colors: ReturnType<typeof useColors> }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2000 }),
        withTiming(1, { duration: 2000 }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.orbWrap, style]}>
      <View style={[styles.orbOuter, { borderColor: colors.primaryBorder }]} />
      <View style={[styles.orbInner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
        <Feather name="cpu" size={40} color={colors.primary} />
      </View>
    </Animated.View>
  );
}

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const haptics = useHaptics();

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleNext = () => {
    haptics.medium();
    router.push('/(onboarding)/features');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: top, paddingBottom: bottom }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.orbSection}>
          <PulsingOrb colors={colors} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.textSection}>
          <Text style={[styles.headline, { color: colors.text }]}>
            Welcome to{'\n'}
            <Text style={{ color: colors.primary }}>NeuralKey</Text>
          </Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            Your private AI workspace. Bring your own API keys and connect to any AI provider. Everything stays on your device.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.features}>
          {[
            { icon: 'shield' as const, text: 'Your keys, your data. Never stored in the cloud.' },
            { icon: 'zap' as const, text: 'Connect OpenAI, Anthropic, Gemini, and more.' },
            { icon: 'sliders' as const, text: 'Customizable agents with unique personalities.' },
          ].map(({ icon, text }, i) => (
            <View key={i} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryMuted, borderColor: colors.primaryBorder }]}>
                <Feather name={icon} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.textMuted }]}>{text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.footer}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.btnText}>Get Started</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 40 },
  orbSection: { alignItems: 'center' },
  orbWrap: { alignItems: 'center', justifyContent: 'center', width: 140, height: 140 },
  orbOuter: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
  },
  orbInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: { gap: 12 },
  headline: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  features: { gap: 14 },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
