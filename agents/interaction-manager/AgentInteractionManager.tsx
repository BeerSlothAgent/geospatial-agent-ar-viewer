import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { MessageCircle, Mic, Info, X, Star, Navigation } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import ChatInterface from '../chat-interfaces/ChatInterface';
import VoiceInterface from '../voice-handlers/VoiceInterface';
import AgentInfoPanel from '../ar-features/AgentInfoPanel';
import MCPIntegration from '../mcp-integrations/MCPIntegration';

interface AgentInteractionManagerProps {
  agent: DeployedObject;
  userLocation: LocationData | null;
  onClose: () => void;
  visible: boolean;
}

export default function AgentInteractionManager({
  agent,
  userLocation,
  onClose,
  visible,
}: AgentInteractionManagerProps) {
  const [activeInterface, setActiveInterface] = useState<'menu' | 'chat' | 'voice' | 'info' | 'mcp'>('menu');
  const [isFavorite, setIsFavorite] = useState(false);

  // Calculate distance to agent
  const calculateDistance = () => {
    if (!userLocation) return 0;
    return agent.distance_meters || 0;
  };

  // Get agent capabilities based on type and configuration
  const getAgentCapabilities = () => {
    const capabilities = {
      chat: true, // Default enabled
      voice: true, // Default enabled
      mcp: false,
      navigation: true,
      info: true,
    };

    // Agent type specific capabilities
    switch (agent.object_type) {
      case 'Home Personal':
        capabilities.mcp = true;
        break;
      case 'Intelligent Assistant':
        capabilities.mcp = true;
        break;
      case 'Local Services':
        capabilities.mcp = true;
        break;
      case 'Tutor/Teacher':
        capabilities.mcp = true;
        break;
      default:
        break;
    }

    return capabilities;
  };

  const capabilities = getAgentCapabilities();
  const distance = calculateDistance();

  const handleInteraction = (type: 'chat' | 'voice' | 'info' | 'mcp') => {
    console.log(`🤖 Starting ${type} interaction with agent:`, agent.name);
    setActiveInterface(type);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to favorites in database
    Alert.alert(
      isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      `${agent.name} has been ${isFavorite ? 'removed from' : 'added to'} your favorites.`
    );
  };

  const handleNavigation = () => {
    Alert.alert(
      'AR Navigation',
      `Navigate to ${agent.name}? This will show AR directions to the agent's location.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Navigate', onPress: () => console.log('🧭 Starting AR navigation to agent') }
      ]
    );
  };

  const renderMainMenu = () => (
    <View style={styles.menuContainer}>
      {/* Agent Header */}
      <View style={styles.agentHeader}>
        <View style={styles.agentIcon}>
          <Text style={styles.agentEmoji}>
            {agent.object_type === 'Home Personal' ? '🏠' :
             agent.object_type === 'Landmark' ? '📍' :
             agent.object_type === 'Intelligent Assistant' ? '🤖' :
             agent.object_type === 'Content Creator' ? '🎨' :
             agent.object_type === 'Local Services' ? '🏪' :
             agent.object_type === 'Tutor/Teacher' ? '👨‍🏫' :
             agent.object_type === '3D World Modelling' ? '🌍' :
             agent.object_type === 'Game Agent' ? '🎮' : '🤖'}
          </Text>
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentType}>{agent.object_type}</Text>
          <Text style={styles.agentDistance}>{distance.toFixed(1)}m away</Text>
        </View>
        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
          <Star 
            size={20} 
            color={isFavorite ? "#fbbf24" : "#6b7280"} 
            fill={isFavorite ? "#fbbf24" : "none"}
            strokeWidth={2} 
          />
        </TouchableOpacity>
      </View>

      {/* Interaction Options */}
      <View style={styles.interactionGrid}>
        {capabilities.chat && (
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction('chat')}
          >
            <MessageCircle size={24} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.interactionText}>Chat</Text>
          </TouchableOpacity>
        )}

        {capabilities.voice && (
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction('voice')}
          >
            <Mic size={24} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.interactionText}>Voice</Text>
          </TouchableOpacity>
        )}

        {capabilities.info && (
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction('info')}
          >
            <Info size={24} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.interactionText}>Info</Text>
          </TouchableOpacity>
        )}

        {capabilities.mcp && (
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleInteraction('mcp')}
          >
            <Text style={styles.mcpIcon}>⚡</Text>
            <Text style={styles.interactionText}>Functions</Text>
          </TouchableOpacity>
        )}

        {capabilities.navigation && (
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={handleNavigation}
          >
            <Navigation size={24} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.interactionText}>Navigate</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Agent Description */}
      {agent.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{agent.description}</Text>
        </View>
      )}
    </View>
  );

  const renderActiveInterface = () => {
    switch (activeInterface) {
      case 'chat':
        return (
          <ChatInterface
            agent={agent}
            onBack={() => setActiveInterface('menu')}
          />
        );
      case 'voice':
        return (
          <VoiceInterface
            agent={agent}
            onBack={() => setActiveInterface('menu')}
          />
        );
      case 'info':
        return (
          <AgentInfoPanel
            agent={agent}
            userLocation={userLocation}
            onBack={() => setActiveInterface('menu')}
          />
        );
      case 'mcp':
        return (
          <MCPIntegration
            agent={agent}
            onBack={() => setActiveInterface('menu')}
          />
        );
      default:
        return renderMainMenu();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={activeInterface === 'menu' ? onClose : () => setActiveInterface('menu')}
            style={styles.backButton}
          >
            <X size={24} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeInterface === 'menu' ? 'Agent Interaction' :
             activeInterface === 'chat' ? 'Chat' :
             activeInterface === 'voice' ? 'Voice' :
             activeInterface === 'info' ? 'Agent Info' :
             activeInterface === 'mcp' ? 'Functions' : 'Agent'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderActiveInterface()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  // Menu
  menuContainer: {
    flex: 1,
    padding: 20,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  agentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  agentEmoji: {
    fontSize: 24,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  agentType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  agentDistance: {
    fontSize: 12,
    color: '#9ca3af',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Interaction Grid
  interactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  interactionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  interactionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  mcpIcon: {
    fontSize: 24,
  },
  
  // Description
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});