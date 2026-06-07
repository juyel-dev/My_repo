import { Feather } from '@expo/vector-icons';
import type { AgentIcon, Capability, ProviderType } from '@/types';

export const AGENT_ICONS: Record<AgentIcon | string, keyof typeof Feather.glyphMap> = {
  bot: 'cpu',
  code: 'code',
  globe: 'globe',
  cpu: 'cpu',
  flask: 'zap',
  brain: 'activity',
};

export const CAP_ICONS: Record<Capability, keyof typeof Feather.glyphMap> = {
  tools: 'tool',
  memory: 'database',
  vision: 'eye',
  mcp: 'server',
  reasoning: 'activity',
};

export const CAP_COLORS: Record<Capability, string> = {
  tools: '#8b5cf6',
  memory: '#3b82f6',
  vision: '#fbbf24',
  mcp: '#4ade80',
  reasoning: '#f97316',
};

export const PROVIDER_ICONS: Record<ProviderType, keyof typeof Feather.glyphMap> = {
  openai: 'zap',
  anthropic: 'sun',
  gemini: 'star',
  custom: 'settings',
};

export const CAP_LABELS: Record<Capability, string> = {
  tools: 'Tools',
  memory: 'Memory',
  vision: 'Vision',
  mcp: 'MCP',
  reasoning: 'Reasoning',
};
