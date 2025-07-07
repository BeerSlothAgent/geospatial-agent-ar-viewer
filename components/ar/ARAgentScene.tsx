import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import { RangeDetectionService } from '@/services/RangeDetectionService';
import Agent3DObject from './Agent3DObject';
import { calculateAgentPositions, AgentDisplayData } from './AgentPositioning';
import { X, Info, MapPin, Zap } from 'lucide-react-native';

interface ARAgentSceneProps {
  agents: DeployedObject[];
  userLocation: LocationData | null;
  onAgentSelect?: (agent: DeployedObject) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ARAgentScene({ agents, userLocation, onAgentSelect }: ARAgentSceneProps) {
  const [agentPositions, setAgentPositions] = useState<Record<string, AgentDisplayData>>({});
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [agentsInRange, setAgentsInRange] = useState<DeployedObject[]>([]);
 const [isInitialized, setIsInitialized] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const rangeService = RangeDetectionService.getInstance();
  
  // Calculate agent positions when agents or user location changes
  useEffect(() => {
    if (agents.length > 0) {
     setIsInitialized(true);
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

  // Update range detection service
  useEffect(() => {
    if (userLocation) {
      rangeService.updateUserLocation(userLocation);
    }
    if (agents.length > 0) {
      rangeService.updateAgents(agents);
    }

    // Subscribe to range updates
    const unsubscribe = rangeService.subscribe((inRangeAgents) => {
      setAgentsInRange(inRangeAgents);
    });

    return unsubscribe;
  }, [agents, userLocation]);
  
  // Handle agent click
  const handleAgentClick = (agent: DeployedObject) => {
    console.log('Agent clicked:', agent.name);
    setSelectedAgent(agent);
    setShowAgentModal(true);
    
    // Call parent handler if provided
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };
  
  // Distribute agents in a grid pattern
  const getAgentPosition = (index: number) => {
    const columns = 3;
    const rows = Math.ceil(agents.length / columns);
    
    // Calculate grid cell size
    const cellWidth = screenWidth / (columns + 1);
    const cellHeight = screenHeight / (rows + 1);
    
    // Calculate position in grid
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    // Add some randomness to positions
    const randomX = (Math.random() - 0.5) * (cellWidth * 0.2);
    const randomY = (Math.random() - 0.5) * (cellHeight * 0.2);
    
    return {
      x: cellWidth * (col + 0.5) + randomX,
      y: cellHeight * (row + 0.5) + randomY,
    };
  };
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 3D Objects Layer */}
     {isInitialized && (
      <View style={styles.objectsLayer} pointerEvents="box-none">
        {agents.map((agent, index) => {
          const positionData = agentPositions[agent.id];
          if (!positionData) return null;
          
          // Get position in grid
          const { x, y } = getAgentPosition(index);
          
          // Vary size based on agent type and distance
          const baseSize = 70; // Base size in pixels
          const distanceFactor = Math.max(0.5, 1 - (positionData.distance / 100) * 0.5);
          const displaySize = baseSize * positionData.size * distanceFactor;
          
          // Check if agent is in range
          const isInRange = agentsInRange.some(a => a.id === agent.id);

          return (
            <View
              key={agent.id}
              style={[
                styles.agentContainer,
                {
                  left: x - (displaySize / 2), // Center horizontally
                  top: y - (displaySize / 2),  // Center vertically
                  width: displaySize,
                  height: displaySize,
                  zIndex: isInRange ? 1001 : 1000 - Math.round(positionData.distance), // In-range agents in front
                }
              ]}
              pointerEvents="box-none"
            >
              <Agent3DObject
                agent={agent}
                size={displaySize}
                isInRange={isInRange}
                onPress={() => handleAgentClick(agent)}
              />
              
              {/* Agent Label */}
              <View style={styles.agentLabel}>
                <Text style={styles.agentName} numberOfLines={1}>
                  {agent.name || `NEAR Agent ${index + 1}`}
                </Text>
                <Text style={styles.agentDistance}>
                  {positionData.distance.toFixed(1)}m
                </Text>
                {isInRange && (
                  <View style={styles.inRangeBadge}>
                    <Text style={styles.inRangeText}>NEAR Range</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
     )}
      
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
              <Text style={styles.modalTitle}>{selectedAgent?.name || 'NEAR Agent'}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAgentModal(false)}
              >
                <X size={20} color="#374151" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.agentTypeContainer}>
              <Text style={styles.agentType}>NEAR {selectedAgent?.object_type || 'Agent'}</Text>
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
                    Fee: {selectedAgent.interaction_fee_usdfc} USDFC on NEAR
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
              <Text style={styles.interactButtonText}>Interact with NEAR Agent</Text>
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
    pointerEvents: 'box-none',
  },
  agentContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
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
  inRangeBadge: {
    backgroundColor: '#00EC97',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  inRangeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
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
    backgroundColor: '#00EC97',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  interactButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
});