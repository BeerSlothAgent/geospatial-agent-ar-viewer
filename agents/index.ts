// Agent Interface System - Main Export File

// Interaction Manager
export { default as AgentInteractionManager } from './interaction-manager/AgentInteractionManager';

// Chat Interfaces
export { default as ChatInterface } from './chat-interfaces/ChatInterface';

// Voice Handlers
export { default as VoiceInterface } from './voice-handlers/VoiceInterface';

// AR Features
export { default as AgentInfoPanel } from './ar-features/AgentInfoPanel';

// MCP Integrations
export { default as MCPIntegration } from './mcp-integrations/MCPIntegration';

// Agent Filters
export { default as AgentFilter } from './agent-filters/AgentFilter';

// Wallet Interfaces
export { default as WalletInterface } from './wallet-interfaces/WalletInterface';

// Agent Types
export const AGENT_TYPES = [
  'Home Personal',
  'Landmark',
  'Intelligent Assistant',
  'Content Creator',
  'Local Services',
  'Tutor/Teacher',
  '3D World Modelling',
  'Game Agent',
];

// Location Types
export const LOCATION_TYPES = [
  'Home',
  'Street',
  'Countryside',
  'Classroom',
  'Office',
];

// Agent Capabilities
export interface AgentCapabilities {
  chat_enabled: boolean;
  voice_enabled: boolean;
  defi_enabled: boolean;
  mcp_integrations: string[];
}

// Agent Interface System Version
export const AGENT_INTERFACE_VERSION = '1.0.0';