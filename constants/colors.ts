import { Platform } from 'react-native';

export const PALETTE = {
  bg: '#0a0a0a',
  bgElevated: '#141414',
  bgCard: '#1a1a1a',
  bgInput: '#1f1f1f',
  bgChip: '#262626',

  violet: '#8b5cf6',
  violetMuted: 'rgba(139,92,246,0.12)',
  violetBorder: 'rgba(139,92,246,0.25)',
  violetGlow: 'rgba(139,92,246,0.08)',

  text: '#f2f2f2',
  textMuted: '#a1a1aa',
  textDim: '#71717a',
  textFaint: '#52525b',

  border: 'rgba(255,255,255,0.08)',
  borderMid: 'rgba(255,255,255,0.12)',

  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ef4444',
  errorMuted: 'rgba(239,68,68,0.10)',
  errorBorder: 'rgba(239,68,68,0.25)',

  white: '#ffffff',
  black: '#000000',
};

const colors = {
  light: {
    background: PALETTE.bg,
    backgroundElevated: PALETTE.bgElevated,
    card: PALETTE.bgCard,
    input: PALETTE.bgInput,
    chip: PALETTE.bgChip,

    primary: PALETTE.violet,
    primaryMuted: PALETTE.violetMuted,
    primaryBorder: PALETTE.violetBorder,
    primaryGlow: PALETTE.violetGlow,

    text: PALETTE.text,
    textMuted: PALETTE.textMuted,
    textDim: PALETTE.textDim,
    textFaint: PALETTE.textFaint,

    foreground: PALETTE.text,
    mutedForeground: PALETTE.textMuted,

    border: PALETTE.border,
    borderMid: PALETTE.borderMid,

    success: PALETTE.success,
    warning: PALETTE.warning,
    destructive: PALETTE.error,
    destructiveMuted: PALETTE.errorMuted,
    destructiveBorder: PALETTE.errorBorder,
  },
  dark: {
    background: PALETTE.bg,
    backgroundElevated: PALETTE.bgElevated,
    card: PALETTE.bgCard,
    input: PALETTE.bgInput,
    chip: PALETTE.bgChip,

    primary: PALETTE.violet,
    primaryMuted: PALETTE.violetMuted,
    primaryBorder: PALETTE.violetBorder,
    primaryGlow: PALETTE.violetGlow,

    text: PALETTE.text,
    textMuted: PALETTE.textMuted,
    textDim: PALETTE.textDim,
    textFaint: PALETTE.textFaint,

    foreground: PALETTE.text,
    mutedForeground: PALETTE.textMuted,

    border: PALETTE.border,
    borderMid: PALETTE.borderMid,

    success: PALETTE.success,
    warning: PALETTE.warning,
    destructive: PALETTE.error,
    destructiveMuted: PALETTE.errorMuted,
    destructiveBorder: PALETTE.errorBorder,
  },
  radius: 12,
};

export default colors;

export const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
