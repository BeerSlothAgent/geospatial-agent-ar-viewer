# Agent Interface System

This directory contains the complete Universal Agent Interface System for the Real AR Viewer. It provides a comprehensive set of components and utilities for interacting with all types of agents deployed through the AgentSphere platform.

## Directory Structure

- **interaction-manager/**: Core interaction management system
- **chat-interfaces/**: Text-based communication with agents
- **voice-handlers/**: Voice interaction capabilities
- **ar-features/**: AR-specific features and displays
- **mcp-integrations/**: Model Context Protocol integrations
- **wallet-interfaces/**: Blockchain wallet interactions
- **agent-filters/**: Agent filtering and search functionality

## Key Components

### AgentInteractionManager

The main entry point for agent interactions. This component:
- Displays the agent information
- Provides access to all interaction methods
- Manages the active interface state
- Handles agent capabilities

```jsx
import { AgentInteractionManager } from '@/agents';

// Usage
<AgentInteractionManager
  agent={selectedAgent}
  userLocation={userLocation}
  onClose={() => setShowInteraction(false)}
  visible={showInteraction}
/>
```

### ChatInterface

Text-based communication with agents:
- Message history display
- Text input and sending
- Agent response generation
- Typing indicators

### VoiceInterface

Voice-based interaction with agents:
- Voice recognition (simulated)
- Text-to-speech output
- Voice visualization
- Audio controls

### AgentInfoPanel

Detailed agent information display:
- Agent metadata
- Location details
- Capabilities list
- Technical specifications

### MCPIntegration

External data source integration:
- Weather data (functional)
- Location-based services (mock)
- AI analysis capabilities (mock)
- Agent-specific functions

### WalletInterface

Blockchain wallet interaction:
- Wallet balance display
- Transaction history
- Send/receive functionality (mock)
- Network information

### AgentFilter

Agent filtering and search:
- Filter by agent type
- Distance-based filtering
- Sorting options
- Status filtering

## Usage Guidelines

1. **Initialization**: Import components from the main index file
2. **Agent Data**: All components require a valid DeployedObject from the database
3. **User Location**: Most components need the user's location for distance calculation
4. **Capability Checking**: Components automatically check agent capabilities
5. **Error Handling**: All components include proper error states and fallbacks

## Example Integration

```jsx
import { useState } from 'react';
import { AgentInteractionManager } from '@/agents';
import { DeployedObject } from '@/types/database';
import { useLocation } from '@/hooks/useLocation';

function ARViewer() {
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [showInteraction, setShowInteraction] = useState(false);
  const { location } = useLocation();

  const handleAgentSelect = (agent: DeployedObject) => {
    setSelectedAgent(agent);
    setShowInteraction(true);
  };

  return (
    <View>
      {/* AR View with agent objects */}
      {/* When an agent is tapped, call handleAgentSelect */}
      
      {selectedAgent && (
        <AgentInteractionManager
          agent={selectedAgent}
          userLocation={location}
          onClose={() => setShowInteraction(false)}
          visible={showInteraction}
        />
      )}
    </View>
  );
}
```

## Customization

Each component can be customized through props:
- **Styling**: Most components accept style overrides
- **Behavior**: Callback functions for custom behavior
- **Content**: Custom messages and responses

## Future Enhancements

- Real voice recognition integration
- Live blockchain wallet integration
- Actual MCP function implementation
- Multi-agent interaction capabilities
- Advanced AR visualization features