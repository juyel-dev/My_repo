import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Agent, AppSettings, AppState, Conversation, MCPServer, Message, Model, Provider } from '@/types';
import { DEFAULT_ANTHROPIC_MODELS, DEFAULT_OPENAI_MODELS } from '@/types';

const STORAGE_KEY = '@neuralkey:appstate';
const PERSIST_DEBOUNCE_MS = 800;

const DEFAULT_SETTINGS: AppSettings = {
  persistentMemory: true,
  sessionMemory: true,
  autoSummarize: true,
  hapticFeedback: true,
  streamingEnabled: true,
  onboardingComplete: false,
};

const DEFAULT_AGENT: Agent = {
  id: 'default-assistant',
  name: 'Assistant',
  description: 'General purpose AI assistant',
  icon: 'bot',
  modelId: '',
  systemPrompt: 'You are a helpful, concise AI assistant. Use markdown formatting when appropriate.',
  capabilities: ['tools', 'memory', 'vision'],
  mcpServerIds: [],
  temperature: 0.7,
  maxTokens: 4096,
  enabled: true,
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

interface AppContextValue {
  state: AppState;
  isLoaded: boolean;
  // Providers
  addProvider: (p: Omit<Provider, 'id' | 'createdAt'>) => Promise<Provider>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  toggleProvider: (id: string) => Promise<void>;
  // Models
  addModel: (m: Omit<Model, 'id'>) => Promise<Model>;
  updateModel: (id: string, updates: Partial<Model>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  toggleModel: (id: string) => Promise<void>;
  // Agents
  addAgent: (a: Omit<Agent, 'id'>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgent: (id: string) => Promise<void>;
  // MCP Servers
  addMCPServer: (s: Omit<MCPServer, 'id' | 'status'>) => Promise<MCPServer>;
  updateMCPServer: (id: string, updates: Partial<MCPServer>) => Promise<void>;
  deleteMCPServer: (id: string) => Promise<void>;
  toggleMCPServer: (id: string) => Promise<void>;
  // Conversations
  createConversation: (agentId: string, title?: string) => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, msg: Omit<Message, 'id'>) => Promise<Message>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  deleteLastAssistantMessage: (conversationId: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
  // Data
  clearAllData: () => Promise<void>;
  // AI
  sendMessage: (conversationId: string, content: string, onChunk?: (text: string) => void) => Promise<void>;
  getActiveModel: (agentId: string) => Model | null;
  getActiveProvider: (model: Model) => Provider | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    providers: [],
    models: [],
    agents: [DEFAULT_AGENT],
    mcpServers: [],
    conversations: [],
    settings: DEFAULT_SETTINGS,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Debounced persist timer
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppState>;
          setState(prev => ({
            providers: saved.providers ?? prev.providers,
            models: saved.models ?? prev.models,
            agents: saved.agents?.length ? saved.agents : prev.agents,
            mcpServers: saved.mcpServers ?? prev.mcpServers,
            conversations: saved.conversations ?? prev.conversations,
            settings: { ...prev.settings, ...(saved.settings ?? {}) },
          }));
        }
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  const persistImmediate = useCallback(async (newState: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  }, []);

  const persistDebounced = useCallback((newState: AppState) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      persistImmediate(newState);
    }, PERSIST_DEBOUNCE_MS);
  }, [persistImmediate]);

  const updateState = useCallback((updater: (prev: AppState) => AppState, immediate = false) => {
    setState(prev => {
      const next = updater(prev);
      if (immediate) {
        persistImmediate(next);
      } else {
        persistDebounced(next);
      }
      return next;
    });
  }, [persistImmediate, persistDebounced]);

  // Providers
  const addProvider = useCallback(async (p: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider> => {
    const provider: Provider = { ...p, id: genId(), createdAt: Date.now() };
    const defaultModels = p.type === 'openai'
      ? DEFAULT_OPENAI_MODELS
      : p.type === 'anthropic'
      ? DEFAULT_ANTHROPIC_MODELS
      : [];
    const newModels: Model[] = defaultModels.map(m => ({
      ...m,
      id: genId(),
      providerId: provider.id,
    }));
    updateState(prev => ({
      ...prev,
      providers: [...prev.providers, provider],
      models: [...prev.models, ...newModels],
    }), true);
    return provider;
  }, [updateState]);

  const updateProvider = useCallback(async (id: string, updates: Partial<Provider>) => {
    updateState(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, ...updates } : p),
    }), true);
  }, [updateState]);

  const deleteProvider = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id),
      models: prev.models.filter(m => m.providerId !== id),
    }), true);
  }, [updateState]);

  const toggleProvider = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
    }), true);
  }, [updateState]);

  // Models
  const addModel = useCallback(async (m: Omit<Model, 'id'>): Promise<Model> => {
    const model: Model = { ...m, id: genId() };
    updateState(prev => ({ ...prev, models: [...prev.models, model] }), true);
    return model;
  }, [updateState]);

  const updateModel = useCallback(async (id: string, updates: Partial<Model>) => {
    updateState(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === id ? { ...m, ...updates } : m),
    }), true);
  }, [updateState]);

  const deleteModel = useCallback(async (id: string) => {
    updateState(prev => ({ ...prev, models: prev.models.filter(m => m.id !== id) }), true);
  }, [updateState]);

  const toggleModel = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m),
    }), true);
  }, [updateState]);

  // Agents
  const addAgent = useCallback(async (a: Omit<Agent, 'id'>): Promise<Agent> => {
    const agent: Agent = { ...a, id: genId() };
    updateState(prev => ({ ...prev, agents: [...prev.agents, agent] }), true);
    return agent;
  }, [updateState]);

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    updateState(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === id ? { ...a, ...updates } : a),
    }), true);
  }, [updateState]);

  const deleteAgent = useCallback(async (id: string) => {
    if (id === 'default-assistant') return;
    updateState(prev => ({ ...prev, agents: prev.agents.filter(a => a.id !== id) }), true);
  }, [updateState]);

  const toggleAgent = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a),
    }), true);
  }, [updateState]);

  // MCP Servers
  const addMCPServer = useCallback(async (s: Omit<MCPServer, 'id' | 'status'>): Promise<MCPServer> => {
    const server: MCPServer = { ...s, id: genId(), status: 'disconnected' };
    updateState(prev => ({ ...prev, mcpServers: [...prev.mcpServers, server] }), true);
    return server;
  }, [updateState]);

  const updateMCPServer = useCallback(async (id: string, updates: Partial<MCPServer>) => {
    updateState(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.map(s => s.id === id ? { ...s, ...updates } : s),
    }), true);
  }, [updateState]);

  const deleteMCPServer = useCallback(async (id: string) => {
    updateState(prev => ({ ...prev, mcpServers: prev.mcpServers.filter(s => s.id !== id) }), true);
  }, [updateState]);

  const toggleMCPServer = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }), true);
  }, [updateState]);

  // Conversations
  const createConversation = useCallback(async (agentId: string, title?: string): Promise<Conversation> => {
    const conv: Conversation = {
      id: genId(),
      title: title ?? 'New Chat',
      agentId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: 0,
    };
    updateState(prev => ({ ...prev, conversations: [conv, ...prev.conversations] }), true);
    return conv;
  }, [updateState]);

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, [updateState]);

  const deleteConversation = useCallback(async (id: string) => {
    updateState(prev => ({ ...prev, conversations: prev.conversations.filter(c => c.id !== id) }), true);
  }, [updateState]);

  const addMessage = useCallback(async (conversationId: string, msg: Omit<Message, 'id'>): Promise<Message> => {
    const message: Message = { ...msg, id: genId() };
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages, message];
        const title = c.messages.length === 0 && msg.role === 'user'
          ? msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : '')
          : c.title;
        return { ...c, messages: msgs, updatedAt: Date.now(), title };
      }),
    }));
    return message;
  }, [updateState]);

  const deleteMessage = useCallback(async (conversationId: string, messageId: string) => {
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => {
        if (c.id !== conversationId) return c;
        return { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: Date.now() };
      }),
    }));
  }, [updateState]);

  const deleteLastAssistantMessage = useCallback(async (conversationId: string) => {
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs.splice(i, 1);
            break;
          }
        }
        return { ...c, messages: msgs, updatedAt: Date.now() };
      }),
    }));
  }, [updateState]);

  const deleteAllConversations = useCallback(async () => {
    updateState(prev => ({ ...prev, conversations: [] }), true);
  }, [updateState]);

  // Settings
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }), true);
  }, [updateState]);

  const completeOnboarding = useCallback(async () => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, onboardingComplete: true } }), true);
  }, [updateState]);

  const resetAllSettings = useCallback(async () => {
    updateState(prev => ({ ...prev, settings: DEFAULT_SETTINGS }), true);
  }, [updateState]);

  const clearAllData = useCallback(async () => {
    const newState: AppState = {
      providers: [],
      models: [],
      agents: [DEFAULT_AGENT],
      mcpServers: [],
      conversations: [],
      settings: { ...DEFAULT_SETTINGS, onboardingComplete: true },
    };
    setState(newState);
    await persistImmediate(newState);
  }, [persistImmediate]);

  // AI helpers
  const getActiveModel = useCallback((agentId: string): Model | null => {
    const agent = stateRef.current.agents.find(a => a.id === agentId);
    if (!agent?.modelId) return null;
    return stateRef.current.models.find(m => m.id === agent.modelId && m.enabled) ?? null;
  }, []);

  const getActiveProvider = useCallback((model: Model): Provider | null => {
    return stateRef.current.providers.find(p => p.id === model.providerId && p.enabled) ?? null;
  }, []);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    onChunk?: (text: string) => void,
  ) => {
    const conversation = stateRef.current.conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const agent = stateRef.current.agents.find(a => a.id === conversation.agentId);
    if (!agent) return;

    const model = getActiveModel(conversation.agentId);
    if (!model) throw new Error('No model configured. Please add a provider and model in Settings.');

    const provider = getActiveProvider(model);
    if (!provider) throw new Error('Provider not found or disabled.');

    const messages = conversation.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    if (agent.systemPrompt) {
      messages.unshift({ role: 'system' as const, content: agent.systemPrompt });
    }
    messages.push({ role: 'user' as const, content });

    let responseText = '';

    if (provider.type === 'anthropic') {
      const res = await fetch(`${provider.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model.modelId,
          max_tokens: agent.maxTokens,
          stream: true,
          messages: messages.filter(m => m.role !== 'system'),
          system: agent.systemPrompt || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        let friendly = `API error ${res.status}`;
        try {
          const parsed = JSON.parse(err);
          friendly = parsed?.error?.message ?? friendly;
        } catch {}
        throw new Error(friendly);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body from API');
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]' || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              responseText += parsed.delta.text;
              onChunk?.(responseText);
            }
          } catch {}
        }
      }
    } else {
      const baseUrl = provider.baseUrl ?? (
        provider.type === 'gemini'
          ? 'https://generativelanguage.googleapis.com/v1beta/openai'
          : 'https://api.openai.com/v1'
      );

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: model.modelId,
          messages,
          stream: true,
          temperature: agent.temperature,
          max_tokens: agent.maxTokens,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        let friendly = `API error ${res.status}`;
        try {
          const parsed = JSON.parse(err);
          friendly = parsed?.error?.message ?? friendly;
        } catch {}
        throw new Error(friendly);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body from API');
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]' || !data) continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              responseText += delta;
              onChunk?.(responseText);
            }
          } catch {}
        }
      }
    }

    if (responseText) {
      await addMessage(conversationId, {
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        model: model.name,
      });
    }
  }, [getActiveModel, getActiveProvider, addMessage]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    isLoaded,
    addProvider, updateProvider, deleteProvider, toggleProvider,
    addModel, updateModel, deleteModel, toggleModel,
    addAgent, updateAgent, deleteAgent, toggleAgent,
    addMCPServer, updateMCPServer, deleteMCPServer, toggleMCPServer,
    createConversation, updateConversation, deleteConversation, addMessage,
    deleteMessage, deleteLastAssistantMessage, deleteAllConversations,
    updateSettings, completeOnboarding, resetAllSettings,
    clearAllData,
    sendMessage, getActiveModel, getActiveProvider,
  }), [
    state, isLoaded,
    addProvider, updateProvider, deleteProvider, toggleProvider,
    addModel, updateModel, deleteModel, toggleModel,
    addAgent, updateAgent, deleteAgent, toggleAgent,
    addMCPServer, updateMCPServer, deleteMCPServer, toggleMCPServer,
    createConversation, updateConversation, deleteConversation, addMessage,
    deleteMessage, deleteLastAssistantMessage, deleteAllConversations,
    updateSettings, completeOnboarding, resetAllSettings,
    clearAllData,
    sendMessage, getActiveModel, getActiveProvider,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContextProvider');
  return ctx;
}
