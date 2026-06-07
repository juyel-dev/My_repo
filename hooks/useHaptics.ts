import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export function useHaptics() {
  const impact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (!isNative) return;
    Haptics.impactAsync(style).catch(() => {});
  };

  const notification = (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (!isNative) return;
    Haptics.notificationAsync(type).catch(() => {});
  };

  const light = () => impact(Haptics.ImpactFeedbackStyle.Light);
  const medium = () => impact(Haptics.ImpactFeedbackStyle.Medium);
  const heavy = () => impact(Haptics.ImpactFeedbackStyle.Heavy);
  const success = () => notification(Haptics.NotificationFeedbackType.Success);
  const warning = () => notification(Haptics.NotificationFeedbackType.Warning);
  const error = () => notification(Haptics.NotificationFeedbackType.Error);
  const selection = () => {
    if (!isNative) return;
    Haptics.selectionAsync().catch(() => {});
  };

  return { impact, notification, light, medium, heavy, success, warning, error, selection };
}
