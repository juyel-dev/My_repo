import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

const DOT_SIZE = 7;
const DOTS = [0, 1, 2];

function Dot({ index, color }: { index: number; color: string }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [index, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        style,
      ]}
    />
  );
}

export function TypingIndicator({ visible }: { visible: boolean }) {
  const colors = useColors();

  if (!visible) return null;

  return (
    <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {DOTS.map(i => (
        <Dot key={i} index={i} color={colors.textMuted} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
