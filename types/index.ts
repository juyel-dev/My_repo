export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'custom';
export type AgentIcon = 'bot' | 'code' | 'globe' | 'cpu' | 'flask' | 'brain';
export type Capability = 'tools' | 'memory' | 'vision' | 'mcp' | 'reasoning';
export type MCPTransport = 'SSE' | 'WebSocket' | 'HTTP' | 'STDIO';
export type MCPStatus = 'connected' | 'disconnected' | 'error';

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
  createdAt: number;
}

export interface Model {
  id: string;
  name: string;
  modelId: string;
  providerId: string;
  providerType: ProviderType;
  contextLength: number;
  capabilities: Capability[];
  enabled: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: AgentIcon;
  modelId: string;
  systemPrompt: string;
  capabilities: Capability[];
  mcpServerIds: string[];
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  transport: MCPTransport;
  url: string;
  enabled: boolean;
  status: MCPStatus;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  model?: string;
  mcpInfo?: string;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  totalTokens?: number;
}

export interface AppSettings {
  persistentMemory: boolean;
  sessionMemory: boolean;
  autoSummarize: boolean;
  hapticFeedback: boolean;
  streamingEnabled: boolean;
  onboardingComplete: boolean;
  defaultAgentId?: string;
}

export interface AppState {
  providers: Provider[];
  models: Model[];
  agents: Agent[];
  mcpServers: MCPServer[];
  conversations: Conversation[];
  settings: AppSettings;
}

export const DEFAULT_OPENAI_MODELS: Omit<Model, 'id' | 'providerId'>[] = [
  { name: 'GPT-4o', modelId: 'gpt-4o', providerType: 'openai', contextLength: 128000, capabilities: ['tools', 'vision'], enabled: true },
  { name: 'GPT-4o mini', modelId: 'gpt-4o-mini', providerType: 'openai', contextLength: 128000, capabilities: ['tools', 'vision'], enabled: true },
  { name: 'o3', modelId: 'o3', providerType: 'openai', contextLength: 200000, capabilities: ['reasoning'], enabled: true },
  { name: 'o4-mini', modelId: 'o4-mini', providerType: 'openai', contextLength: 200000, capabilities: ['tools', 'reasoning', 'vision'], enabled: false },
];

export const DEFAULT_ANTHROPIC_MODELS: Omit<Model, 'id' | 'providerId'>[] = [
  { name: 'Claude Sonnet 4', modelId: 'claude-sonnet-4-5', providerType: 'anthropic', contextLength: 200000, capabilities: ['tools', 'vision'], enabled: true },
  { name: 'Claude Haiku 3.5', modelId: 'claude-haiku-3-5', providerType: 'anthropic', contextLength: 200000, capabilities: ['tools', 'vision'], enabled: true },
  { name: 'Claude Opus 4', modelId: 'claude-opus-4-5', providerType: 'anthropic', contextLength: 200000, capabilities: ['tools', 'vision', 'reasoning'], enabled: false },
];
