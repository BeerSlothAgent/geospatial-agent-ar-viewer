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
import { Camera, X, Zap, MapPin, MessageCircle, Play } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import AgentInteractionModal from '@/components/ar/AgentInteractionModal';
import { ARQRCodeGenerator } from '@/components/ar/ARQRCodeGenerator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ARCameraViewProps {
  onClose: () => void;
  onCameraReady?: () => void;
  onError?: (error: string) => void;
  objects: DeployedObject[];
  userLocation?: LocationData | null;
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
  const [showFullARView, setShowFullARView] = useState(false);
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

  // Render the camera view with AR overlay
  if (!showFullARView) {
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

                {/* Full AR View Button */}
                <TouchableOpacity
                  style={styles.fullARButton}
                  onPress={() => setShowFullARView(true)}
                >
                  <Play size={20} color="#000" strokeWidth={2} />
                  <Text style={styles.fullARButtonText}>Enter Agent World</Text>
                  <Text style={styles.poweredByText}>Powered by NEAR</Text>
                </TouchableOpacity>
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
  
  // Full AR View (the view that was previously shown)
  return (
    <View style={styles.container}>
      {/* Full AR View Background */}
      <View style={styles.fullARBackground}>
        <View style={styles.fullAROverlay}>
          {!cameraReady ? (
            <View style={styles.loadingContainer}>
              <Camera size={48} color="#00EC97" strokeWidth={2} />
              <Text style={styles.loadingText}>Initializing Full AR Experience...</Text>
            </View>
          ) : (
            <>
              {/* Full AR Content */}
              <View style={styles.fullARContent}>
                <Text style={styles.fullARTitle}>Full AR Experience</Text>
                <Text style={styles.fullARDescription}>
                  This is the full AR experience with advanced features.
                </Text>
                
                {/* Display agents in a different layout for full AR */}
                <View style={styles.fullARAgents}>
                  {objects.map((agent, index) => {
                    const distance = calculateDistance(agent);
                    return (
                      <TouchableOpacity
                        key={agent.id}
                        style={styles.fullARAgent}
                        onPress={() => handleAgentSelect(agent)}
                      >
                        <Text style={styles.fullARAgentName}>{agent.name || 'NEAR Agent'}</Text>
                        <Text style={styles.fullARAgentDistance}>{distance.toFixed(0)}m</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setShowFullARView(false)}
        activeOpacity={0.8}
      >
        <X size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
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
  fullARButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#00EC97',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fullARButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  poweredByText: {
    position: 'absolute',
    bottom: -20,
    right: 10,
    color: '#00EC97',
    fontSize: 10,
  },
  fullARBackground: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  fullAROverlay: {
    flex: 1,
  },
  fullARContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullARTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  fullARDescription: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  fullARAgents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  fullARAgent: {
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00EC97',
    width: 150,
  },
  fullARAgentName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  fullARAgentDistance: {
    color: '#00EC97',
    fontSize: 12,
  },
});