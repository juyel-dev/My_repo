import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Agent, AppSettings, AppState, Conversation, MCPServer, Message, Model, Provider } from '@/types';
import { DEFAULT_ANTHROPIC_MODELS, DEFAULT_OPENAI_MODELS } from '@/types';

const STORAGE_KEY = '@neuralkey:appstate';

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

  const persist = useCallback(async (newState: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, [persist]);

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
    }));
    return provider;
  }, [updateState]);

  const updateProvider = useCallback(async (id: string, updates: Partial<Provider>) => {
    updateState(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, [updateState]);

  const deleteProvider = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id),
      models: prev.models.filter(m => m.providerId !== id),
    }));
  }, [updateState]);

  const toggleProvider = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p),
    }));
  }, [updateState]);

  // Models
  const addModel = useCallback(async (m: Omit<Model, 'id'>): Promise<Model> => {
    const model: Model = { ...m, id: genId() };
    updateState(prev => ({ ...prev, models: [...prev.models, model] }));
    return model;
  }, [updateState]);

  const updateModel = useCallback(async (id: string, updates: Partial<Model>) => {
    updateState(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, [updateState]);

  const deleteModel = useCallback(async (id: string) => {
    updateState(prev => ({ ...prev, models: prev.models.filter(m => m.id !== id) }));
  }, [updateState]);

  const toggleModel = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      models: prev.models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m),
    }));
  }, [updateState]);

  // Agents
  const addAgent = useCallback(async (a: Omit<Agent, 'id'>): Promise<Agent> => {
    const agent: Agent = { ...a, id: genId() };
    updateState(prev => ({ ...prev, agents: [...prev.agents, agent] }));
    return agent;
  }, [updateState]);

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    updateState(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, [updateState]);

  const deleteAgent = useCallback(async (id: string) => {
    if (id === 'default-assistant') return;
    updateState(prev => ({ ...prev, agents: prev.agents.filter(a => a.id !== id) }));
  }, [updateState]);

  const toggleAgent = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a),
    }));
  }, [updateState]);

  // MCP Servers
  const addMCPServer = useCallback(async (s: Omit<MCPServer, 'id' | 'status'>): Promise<MCPServer> => {
    const server: MCPServer = { ...s, id: genId(), status: 'disconnected' };
    updateState(prev => ({ ...prev, mcpServers: [...prev.mcpServers, server] }));
    return server;
  }, [updateState]);

  const updateMCPServer = useCallback(async (id: string, updates: Partial<MCPServer>) => {
    updateState(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, [updateState]);

  const deleteMCPServer = useCallback(async (id: string) => {
    updateState(prev => ({ ...prev, mcpServers: prev.mcpServers.filter(s => s.id !== id) }));
  }, [updateState]);

  const toggleMCPServer = useCallback(async (id: string) => {
    updateState(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }));
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
    updateState(prev => ({ ...prev, conversations: [conv, ...prev.conversations] }));
    return conv;
  }, [updateState]);

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }, [updateState]);

  const deleteConversation = useCallback(async (id: string) => {
    updateState(prev => ({ ...prev, conversations: prev.conversations.filter(c => c.id !== id) }));
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

  const deleteAllConversations = useCallback(async () => {
    updateState(prev => ({ ...prev, conversations: [] }));
  }, [updateState]);

  // Settings
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, [updateState]);

  const completeOnboarding = useCallback(async () => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, onboardingComplete: true } }));
  }, [updateState]);

  const resetAllSettings = useCallback(async () => {
    updateState(prev => ({ ...prev, settings: DEFAULT_SETTINGS }));
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
    await persist(newState);
  }, [persist]);

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

    try {
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
          throw new Error(`API error ${res.status}: ${err}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
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
          throw new Error(`API error ${res.status}: ${err}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
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
    } catch (err) {
      throw err;
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
    createConversation, updateConversation, deleteConversation, addMessage, deleteAllConversations,
    updateSettings, completeOnboarding, resetAllSettings,
    clearAllData,
    sendMessage, getActiveModel, getActiveProvider,
  }), [
    state, isLoaded,
    addProvider, updateProvider, deleteProvider, toggleProvider,
    addModel, updateModel, deleteModel, toggleModel,
    addAgent, updateAgent, deleteAgent, toggleAgent,
    addMCPServer, updateMCPServer, deleteMCPServer, toggleMCPServer,
    createConversation, updateConversation, deleteConversation, addMessage, deleteAllConversations,
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
