import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Camera, X, Zap, MapPin, MessageCircle } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import AgentInteractionModal from '@/components/ar/AgentInteractionModal';
import { ARQRCodeGenerator } from '@/components/ar/ARQRCodeGenerator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ARCameraViewProps {
  onClose: () => void;
  onCameraReady?: () => void;
  onError?: (error: string) => void;
  objects: DeployedObject[];
  userLocation?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null;
}

export default function ARCameraView({
  onClose,
  onCameraReady,
  onError,
  objects,
  userLocation,
}: ARCameraViewProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const qrCodeGeneratorRef = useRef<ARQRCodeGenerator | null>(null);

  useEffect(() => {
    // Initialize QR code generator
    qrCodeGeneratorRef.current = new ARQRCodeGenerator();
    
    // Simulate camera initialization
    const timer = setTimeout(() => {
      setCameraReady(true);
      onCameraReady?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onCameraReady]);

  const handleAgentSelect = (agent: DeployedObject) => {
    setSelectedAgent(agent);
    setShowInteractionModal(true);
  };

  const handleCloseInteractionModal = () => {
    setShowInteractionModal(false);
    setSelectedAgent(null);
  };

  const calculateDistance = (agent: DeployedObject): number => {
    if (!userLocation) return 0;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = userLocation.latitude * Math.PI / 180;
    const φ2 = agent.latitude * Math.PI / 180;
    const Δφ = (agent.latitude - userLocation.latitude) * Math.PI / 180;
    const Δλ = (agent.longitude - userLocation.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const renderARAgent = (agent: DeployedObject, index: number) => {
    const distance = calculateDistance(agent);
    const isInRange = distance <= (agent.interaction_range || 25);
    
    // Position agents in a semi-circle around the user
    const angle = (index / objects.length) * Math.PI;
    const radius = 150;
    const x = screenWidth / 2 + Math.cos(angle) * radius;
    const y = screenHeight / 2 + Math.sin(angle) * radius;

    return (
      <TouchableOpacity
        key={agent.id}
        style={[
          styles.arAgent,
          {
            left: x - 30,
            top: y - 30,
            opacity: isInRange ? 1 : 0.6,
          }
        ]}
        onPress={() => handleAgentSelect(agent)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.agentIcon,
          { backgroundColor: isInRange ? '#00EC97' : '#666' }
        ]}>
          <MessageCircle size={20} color="#000" strokeWidth={2} />
        </View>
        
        <View style={styles.agentInfo}>
          <Text style={styles.agentName} numberOfLines={1}>
            {agent.name || 'NEAR Agent'}
          </Text>
          <Text style={styles.agentDistance}>
            {distance.toFixed(0)}m away
          </Text>
        </View>
        
        {isInRange && (
          <View style={styles.interactionIndicator}>
            <Zap size={12} color="#00EC97" strokeWidth={2} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Camera Background Simulation */}
      <View style={styles.cameraBackground}>
        <View style={styles.cameraOverlay}>
          {!cameraReady ? (
            <View style={styles.loadingContainer}>
              <Camera size={48} color="#00EC97" strokeWidth={2} />
              <Text style={styles.loadingText}>Initializing NEAR Agent AR...</Text>
            </View>
          ) : (
            <>
              {/* AR Agents */}
              {objects.map((agent, index) => renderARAgent(agent, index))}
              
              {/* AR UI Elements */}
              <View style={styles.arUI}>
                <View style={styles.statusBar}>
                  <View style={styles.statusItem}>
                    <MapPin size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.statusText}>
                      {objects.length} NEAR Agents Detected
                    </Text>
                  </View>
                  
                  {userLocation && (
                    <View style={styles.statusItem}>
                      <Zap size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.statusText}>RTK Precision Active</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.instructions}>
                  <Text style={styles.instructionText}>
                    Tap on NEAR agents to interact
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <X size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      {/* Agent Interaction Modal */}
      {selectedAgent && qrCodeGeneratorRef.current && (
        <AgentInteractionModal
          agent={selectedAgent}
          visible={showInteractionModal}
          onClose={handleCloseInteractionModal}
          userLocation={userLocation}
          arQRCodeGenerator={qrCodeGeneratorRef.current}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraBackground: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  cameraOverlay: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  arAgent: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  agentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  agentInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  agentName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  agentDistance: {
    color: '#00EC97',
    fontSize: 10,
    fontWeight: '500',
  },
  interactionIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00EC97',
  },
  arUI: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  instructions: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00EC97',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 1000,
  },
});