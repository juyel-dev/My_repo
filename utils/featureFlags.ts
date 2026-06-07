export interface FeatureFlags {
  enableStreaming: boolean;
  enableMCPServers: boolean;
  enableMultipleAgents: boolean;
  enablePersistentMemory: boolean;
  enableHaptics: boolean;
  enableAutoTitleConversations: boolean;
  enableEndpointTesting: boolean;
  showTokenCounts: boolean;
  showModelLabels: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableStreaming: true,
  enableMCPServers: true,
  enableMultipleAgents: true,
  enablePersistentMemory: true,
  enableHaptics: true,
  enableAutoTitleConversations: true,
  enableEndpointTesting: true,
  showTokenCounts: true,
  showModelLabels: true,
};

let currentFlags: FeatureFlags = { ...DEFAULT_FLAGS };

export const featureFlags = {
  get: (): FeatureFlags => ({ ...currentFlags }),
  isEnabled: (flag: keyof FeatureFlags): boolean => currentFlags[flag],
  override: (overrides: Partial<FeatureFlags>): void => {
    currentFlags = { ...currentFlags, ...overrides };
  },
  reset: (): void => {
    currentFlags = { ...DEFAULT_FLAGS };
  },
};
