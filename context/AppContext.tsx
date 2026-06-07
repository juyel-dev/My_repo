import React, {
  createContext, useCallback, useContext, useEffect,
  useMemo, useRef, useState,
} from 'react';
import type {
  Agent, AppSettings, AppState, Conversation,
  MCPServer, Message, Model, Provider,
} from '@/types';
import { DEFAULT_ANTHROPIC_MODELS, DEFAULT_OPENAI_MODELS } from '@/types';
import { loadState, saveState } from '@/utils/storage';
import { logger } from '@/services/logger';
import { streamMessage, buildMessages } from '@/services/aiService';

const PERSIST_DEBOUNCE_MS = 600;

export const DEFAULT_SETTINGS: AppSettings = {
  persistentMemory: true,
  sessionMemory: true,
  autoSummarize: true,
  hapticFeedback: true,
  streamingEnabled: true,
  onboardingComplete: false,
};

export const DEFAULT_AGENT: Agent = {
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
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

interface AppContextValue {
  state: AppState;
  isLoaded: boolean;
  addProvider: (p: Omit<Provider, 'id' | 'createdAt'>) => Promise<Provider>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  toggleProvider: (id: string) => Promise<void>;
  addModel: (m: Omit<Model, 'id'>) => Promise<Model>;
  updateModel: (id: string, updates: Partial<Model>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  toggleModel: (id: string) => Promise<void>;
  clearAllModels: () => Promise<void>;
  addAgent: (a: Omit<Agent, 'id'>) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgent: (id: string) => Promise<void>;
  clearCustomAgents: () => Promise<void>;
  addMCPServer: (s: Omit<MCPServer, 'id' | 'status'>) => Promise<MCPServer>;
  updateMCPServer: (id: string, updates: Partial<MCPServer>) => Promise<void>;
  deleteMCPServer: (id: string) => Promise<void>;
  toggleMCPServer: (id: string) => Promise<void>;
  createConversation: (agentId: string, title?: string) => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, msg: Omit<Message, 'id'>) => Promise<Message>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  deleteLastAssistantMessage: (conversationId: string) => Promise<void>;
  deleteAllConversations: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
  clearAllData: () => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    onChunk?: (text: string) => void,
    signal?: AbortSignal,
  ) => Promise<void>;
  getActiveModel: (agentId: string) => Model | null;
  getActiveProvider: (model: Model) => Provider | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL_STATE: AppState = {
  providers: [],
  models: [],
  agents: [DEFAULT_AGENT],
  mcpServers: [],
  conversations: [],
  settings: DEFAULT_SETTINGS,
};

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await loadState<Partial<AppState>>();
      if (saved) {
        setState(prev => ({
          providers: saved.providers ?? prev.providers,
          models: saved.models ?? prev.models,
          agents: saved.agents?.length ? saved.agents : prev.agents,
          mcpServers: saved.mcpServers ?? prev.mcpServers,
          conversations: saved.conversations ?? prev.conversations,
          settings: { ...prev.settings, ...(saved.settings ?? {}) },
        }));
      }
      setIsLoaded(true);
      logger.info('AppState loaded from storage');
    })();
  }, []);

  const persist = useCallback((newState: AppState, immediate = false) => {
    if (immediate) {
      saveState(newState);
      return;
    }
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => saveState(newState), PERSIST_DEBOUNCE_MS);
  }, []);

  const updateState = useCallback((
    updater: (prev: AppState) => AppState,
    immediate = false,
  ) => {
    setState(prev => {
      const next = updater(prev);
      persist(next, immediate);
      return next;
    });
  }, [persist]);

  const addProvider = useCallback(async (p: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider> => {
    const provider: Provider = { ...p, id: genId(), createdAt: Date.now() };
    const defaultModels = p.type === 'openai'
      ? DEFAULT_OPENAI_MODELS
      : p.type === 'anthropic'
        ? DEFAULT_ANTHROPIC_MODELS
        : [];
    const newModels: Model[] = defaultModels.map(m => ({
      ...m, id: genId(), providerId: provider.id,
    }));
    updateState(prev => ({
      ...prev,
      providers: [...prev.providers, provider],
      models: [...prev.models, ...newModels],
    }), true);
    logger.info('Provider added', { name: p.name, type: p.type });
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

  const clearAllModels = useCallback(async () => {
    updateState(prev => ({ ...prev, models: [], providers: [] }), true);
  }, [updateState]);

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

  const clearCustomAgents = useCallback(async () => {
    updateState(prev => ({
      ...prev,
      agents: prev.agents.filter(a => a.id === 'default-assistant'),
    }), true);
  }, [updateState]);

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
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.filter(c => c.id !== id),
    }), true);
  }, [updateState]);

  const addMessage = useCallback(async (
    conversationId: string,
    msg: Omit<Message, 'id'>,
  ): Promise<Message> => {
    const message: Message = { ...msg, id: genId() };
    updateState(prev => ({
      ...prev,
      conversations: prev.conversations.map(c => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages, message];
        const title = c.messages.length === 0 && msg.role === 'user'
          ? msg.content.slice(0, 52).trimEnd() + (msg.content.length > 52 ? '…' : '')
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
          if (msgs[i].role === 'assistant') { msgs.splice(i, 1); break; }
        }
        return { ...c, messages: msgs, updatedAt: Date.now() };
      }),
    }));
  }, [updateState]);

  const deleteAllConversations = useCallback(async () => {
    updateState(prev => ({ ...prev, conversations: [] }), true);
  }, [updateState]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    updateState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }), true);
  }, [updateState]);

  const completeOnboarding = useCallback(async () => {
    updateState(prev => ({
      ...prev,
      settings: { ...prev.settings, onboardingComplete: true },
    }), true);
  }, [updateState]);

  const resetAllSettings = useCallback(async () => {
    updateState(prev => ({ ...prev, settings: DEFAULT_SETTINGS }), true);
  }, [updateState]);

  const clearAllData = useCallback(async () => {
    const newState: AppState = {
      ...INITIAL_STATE,
      settings: { ...DEFAULT_SETTINGS, onboardingComplete: true },
    };
    setState(newState);
    await saveState(newState);
    logger.info('All data cleared');
  }, []);

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
    signal?: AbortSignal,
  ) => {
    const conversation = stateRef.current.conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    const agent = stateRef.current.agents.find(a => a.id === conversation.agentId);
    if (!agent) throw new Error('Agent not found');
    const model = getActiveModel(conversation.agentId);
    if (!model) throw new Error('No model configured. Add a provider in Settings.');
    const provider = getActiveProvider(model);
    if (!provider) throw new Error('Provider not found or disabled.');

    const messages = buildMessages(conversation.messages, content, agent);

    const responseText = await streamMessage({
      conversationId,
      messages,
      agent,
      model,
      provider,
      onChunk: onChunk ?? (() => {}),
      signal,
    });

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
    state, isLoaded,
    addProvider, updateProvider, deleteProvider, toggleProvider,
    addModel, updateModel, deleteModel, toggleModel, clearAllModels,
    addAgent, updateAgent, deleteAgent, toggleAgent, clearCustomAgents,
    addMCPServer, updateMCPServer, deleteMCPServer, toggleMCPServer,
    createConversation, updateConversation, deleteConversation,
    addMessage, deleteMessage, deleteLastAssistantMessage, deleteAllConversations,
    updateSettings, completeOnboarding, resetAllSettings, clearAllData,
    sendMessage, getActiveModel, getActiveProvider,
  }), [
    state, isLoaded,
    addProvider, updateProvider, deleteProvider, toggleProvider,
    addModel, updateModel, deleteModel, toggleModel, clearAllModels,
    addAgent, updateAgent, deleteAgent, toggleAgent, clearCustomAgents,
    addMCPServer, updateMCPServer, deleteMCPServer, toggleMCPServer,
    createConversation, updateConversation, deleteConversation,
    addMessage, deleteMessage, deleteLastAssistantMessage, deleteAllConversations,
    updateSettings, completeOnboarding, resetAllSettings, clearAllData,
    sendMessage, getActiveModel, getActiveProvider,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContextProvider');
  return ctx;
}
