import { Platform } from 'react-native';

const palette = {
  background: '#0d0d0d',
  foreground: '#f5f5f5',
  card: '#171717',
  cardForeground: '#f5f5f5',
  primary: '#8b5cf6',
  primaryForeground: '#ffffff',
  secondary: '#262626',
  secondaryForeground: '#f5f5f5',
  muted: '#141414',
  mutedForeground: '#737373',
  accent: '#8b5cf6',
  accentForeground: '#ffffff',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  border: 'rgba(255,255,255,0.1)',
  input: '#1f1f1f',
  text: '#f5f5f5',
  tint: '#8b5cf6',
  success: '#4ade80',
  warning: '#fbbf24',
  dim: '#525252',
  subtext: '#a1a1a1',
};

const colors = {
  light: { ...palette },
  dark: { ...palette },
  radius: 12,
};

export default colors;

export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
