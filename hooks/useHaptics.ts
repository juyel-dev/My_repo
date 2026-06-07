import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';

export function useHaptics() {
  const { state } = useApp();
  const enabled = state.settings.hapticFeedback;

  const impact = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (!enabled) return;
    Haptics.impactAsync(style);
  }, [enabled]);

  const notification = useCallback((type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (!enabled) return;
    Haptics.notificationAsync(type);
  }, [enabled]);

  const selection = useCallback(() => {
    if (!enabled) return;
    Haptics.selectionAsync();
  }, [enabled]);

  return { impact, notification, selection };
}
