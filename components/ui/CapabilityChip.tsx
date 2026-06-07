import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CAP_COLORS, CAP_ICONS, CAP_LABELS } from '@/constants/agentConfig';
import type { Capability } from '@/types';
import { useColors } from '@/hooks/useColors';

interface Props {
  capability: Capability;
}

export function CapabilityChip({ capability }: Props) {
  const colors = useColors();
  const color = CAP_COLORS[capability] ?? colors.primary;
  const icon = CAP_ICONS[capability] ?? 'zap';
  const label = CAP_LABELS[capability] ?? capability;

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: `${color}18`, borderColor: `${color}40` },
      ]}
    >
      <Feather name={icon} size={10} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
