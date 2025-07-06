import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import Agent3DObject from './Agent3DObject';
import { calculateAgentPositions, AgentDisplayData } from './AgentPositioning';
import { X, Info, MapPin, Zap } from 'lucide-react-native';

interface ARAgentSceneProps {
  agents: DeployedObject[];
  userLocation: LocationData | null;
  onAgentSelect?: (agent: DeployedObject) => void;
}

export default function ARAgentScene({ agents, userLocation, onAgentSelect }: ARAgentSceneProps) {
  const [agentPositions, setAgentPositions] = useState<Record<string, AgentDisplayData>>({});
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  
  // Calculate agent positions when agents or user location changes
  useEffect(() => {
    if (agents.length > 0 && userLocation) {
      console.log('🔄 Calculating positions for', agents.length, 'agents');
      const positions = calculateAgentPositions(agents, userLocation, 100);
      setAgentPositions(positions);
      
      // Log the calculated positions for debugging
      console.log('📍 Agent positions calculated:', 
        Object.keys(positions).length, 
        'agents positioned'
      );
    }
  }, [agents, userLocation]);
  
  // Handle agent click
  const handleAgentClick = (agent: DeployedObject) => {
    console.log('Agent clicked:', agent.name);
    setSelectedAgent(agent);
    setShowAgentModal(true);
    
    // Haptic feedback on native platforms
    if (Platform.OS !== 'web' && 'expo-haptics' in global) {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
    
    // Call parent handler if provided
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* 3D Objects Layer */}
      <View style={styles.objectsLayer}>
        {agents.map((agent) => {
          const positionData = agentPositions[agent.id];
          if (!positionData) return null;
          
          // Fixed screen positions for visibility testing
          // Distribute agents in a grid pattern across the screen
          const index = agents.findIndex(a => a.id === agent.id);
          const columns = 3;
          const spacing = 120;
          
          const col = index % columns;
          const row = Math.floor(index / columns);
          
          const screenX = 100 + (col * spacing);
          const screenY = 150 + (row * spacing);
          const displaySize = 60;
          
          return (
            <View
              key={agent.id}
              style={[
                styles.agentContainer,
                {
                  left: screenX,
                  top: screenY,
                  zIndex: 1000 - index,
                  opacity: 1,
                }
              ]}
            >
              <Agent3DObject
                agent={agent}
                size={displaySize}
                onPress={() => handleAgentClick(agent)}
              />
              
              {/* Agent Label */}
              <View style={styles.agentLabel}>
                <Text style={styles.agentName} numberOfLines={1}>
                  {agent.name}
                </Text>
                <Text style={styles.agentDistance}>
                  {positionData.distance.toFixed(1)}m
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      
      {/* Agent Info Modal */}
      <Modal
        visible={showAgentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAgentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.agentInfoCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAgent?.name}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAgentModal(false)}
              >
                <X size={20} color="#374151" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.agentTypeContainer}>
              <Text style={styles.agentType}>{selectedAgent?.object_type}</Text>
            </View>
            
            {selectedAgent?.description && (
              <Text style={styles.agentDescription}>
                {selectedAgent.description}
              </Text>
            )}
            
            <View style={styles.agentDetails}>
              <View style={styles.detailItem}>
                <MapPin size={16} color="#00d4ff" strokeWidth={2} />
                <Text style={styles.detailText}>
                  {selectedAgent?.latitude.toFixed(6)}, {selectedAgent?.longitude.toFixed(6)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Info size={16} color="#00d4ff" strokeWidth={2} />
                <Text style={styles.detailText}>
                  Range: {selectedAgent?.visibility_radius || 50}m
                </Text>
              </View>
              
              {selectedAgent?.interaction_fee_usdfc && (
                <View style={styles.detailItem}>
                  <Zap size={16} color="#00d4ff" strokeWidth={2} />
                  <Text style={styles.detailText}>
                    Fee: {selectedAgent.interaction_fee_usdfc} USDFC
                  </Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.interactButton}
              onPress={() => {
                setShowAgentModal(false);
                if (selectedAgent && onAgentSelect) {
                  onAgentSelect(selectedAgent);
                }
              }}
            >
              <Text style={styles.interactButtonText}>Interact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  objectsLayer: {
    flex: 1,
    position: 'relative',
  },
  agentContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translate: ['-50%', '-50%'] }],
  },
  agentLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  agentName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  agentDistance: {
    color: '#00d4ff',
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  agentInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentTypeContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  agentType: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  agentDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  agentDetails: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  interactButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  interactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});