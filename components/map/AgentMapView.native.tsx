import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Camera, X, ArrowLeft } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import { RangeDetectionService } from '@/services/RangeDetectionService';

interface AgentMapViewProps {
  userLocation: LocationData;
  agents: DeployedObject[];
  onClose: () => void;
  onSwitchToCamera: () => void;
  onAgentSelect?: (agent: DeployedObject) => void;
}

const { width, height } = Dimensions.get('window');

export default function AgentMapView({
  userLocation,
  agents,
  onClose,
  onSwitchToCamera,
  onAgentSelect
}: AgentMapViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [agentsInRange, setAgentsInRange] = useState<DeployedObject[]>([]);
  const mapRef = useRef<MapView>(null);
  const rangeService = RangeDetectionService.getInstance();

  // Filter agents in range
  useEffect(() => {
    if (userLocation) {
      rangeService.updateUserLocation(userLocation);
      rangeService.updateAgents(agents);
      
      const inRange = agents.filter(agent => {
        const distance = rangeService.getDistanceToAgent(agent);
        return distance !== null && distance <= (agent.visibility_radius || 50);
      });
      setAgentsInRange(inRange);
    }
  }, [agents, userLocation]);

  // Get agent color based on type
  const getAgentColor = (agentType: string): string => {
    const colorMap: Record<string, string> = {
      'ai_agent': '#3B82F6',
      'study_buddy': '#10B981',
      'tutor': '#8B5CF6',
      'landmark': '#F59E0B',
      'building': '#6B7280',
      'Intelligent Assistant': '#7C3AED',
      'Content Creator': '#EF4444',
      'Local Services': '#0891B2',
      'Tutor/Teacher': '#BE185D',
      '3D World Modelling': '#059669',
      'Game Agent': '#9333EA',
      'test-object': '#3B82F6',
      'info-sphere': '#10B981',
      'test-cube': '#EC4899',
      'test-sphere': '#F59E0B'
    };
    
    return colorMap[agentType] || '#00d4ff';
  };

  // Calculate initial region to show all agents
  const getInitialRegion = () => {
    if (!userLocation) {
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    if (agents.length === 0) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Include user location and all agents
    const latitudes = [userLocation.latitude, ...agents.map(a => a.latitude)];
    const longitudes = [userLocation.longitude, ...agents.map(a => a.longitude)];

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Add padding
    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Nearby Agents</Text>
          <Text style={styles.headerSubtitle}>
            {agentsInRange.length} agent{agentsInRange.length !== 1 ? 's' : ''} in range
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={onSwitchToCamera}
            style={styles.headerButton}
          >
            <Camera size={24} color="#00d4ff" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerButton}
          >
            <X size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={getInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        mapType="standard"
      >
        {/* Agent markers and circles */}
        {agents.map((agent) => {
          const distance = rangeService.getDistanceToAgent(agent);
          const inRange = distance !== null && distance <= (agent.visibility_radius || 50);
          
          return (
            <React.Fragment key={agent.id}>
              {/* Agent visibility circle */}
              <Circle
                center={{
                  latitude: agent.latitude,
                  longitude: agent.longitude,
                }}
                radius={agent.visibility_radius || 50}
                strokeColor={getAgentColor(agent.object_type)}
                fillColor={`${getAgentColor(agent.object_type)}20`}
                strokeWidth={2}
              />
              
              {/* Agent marker */}
              <Marker
                coordinate={{
                  latitude: agent.latitude,
                  longitude: agent.longitude,
                }}
                title={agent.name || 'Agent'}
                description={`${agent.object_type} • ${distance ? Math.round(distance) : '?'}m away`}
                pinColor={getAgentColor(agent.object_type)}
                onPress={() => {
                  setSelectedAgent(agent);
                  if (onAgentSelect) {
                    onAgentSelect(agent);
                  }
                }}
              />
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{agentsInRange.length}</Text>
            <Text style={styles.statLabel}>In Range</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{agents.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {agentsInRange.length > 0 ? 
                Math.round(Math.min(...agentsInRange.map(a => rangeService.getDistanceToAgent(a) || 999))) : 0}m
            </Text>
            <Text style={styles.statLabel}>Closest</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={onSwitchToCamera}
        >
          <Camera size={20} color="white" />
          <Text style={styles.switchButtonText}>Switch to AR Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Agent Info */}
      {selectedAgent && (
        <View style={styles.agentInfoPanel}>
          <View style={styles.agentInfoHeader}>
            <Text style={styles.agentInfoName}>{selectedAgent.name}</Text>
            <TouchableOpacity 
              style={styles.closeInfoButton}
              onPress={() => setSelectedAgent(null)}
            >
              <ArrowLeft size={16} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.agentInfoType}>{selectedAgent.object_type}</Text>
          
          {selectedAgent.description && (
            <Text style={styles.agentInfoDescription}>{selectedAgent.description}</Text>
          )}
          
          <View style={styles.agentInfoDetails}>
            <View style={styles.agentInfoDetail}>
              <Text style={styles.agentInfoDetailText}>
                Distance: {Math.round(rangeService.getDistanceToAgent(selectedAgent) || 0)}m
              </Text>
            </View>
            <View style={styles.agentInfoDetail}>
              <Text style={styles.agentInfoDetailText}>
                Range: {selectedAgent.visibility_radius || 50}m
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.interactButton}
            onPress={() => {
              if (onAgentSelect) onAgentSelect(selectedAgent);
              setSelectedAgent(null);
            }}
          >
            <Text style={styles.interactButtonText}>Interact</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  switchButton: {
    backgroundColor: '#00d4ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  switchButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  agentInfoPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 20,
  },
  agentInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeInfoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentInfoType: {
    fontSize: 14,
    color: '#00d4ff',
    marginBottom: 8,
  },
  agentInfoDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  agentInfoDetails: {
    marginBottom: 12,
  },
  agentInfoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentInfoDetailText: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 8,
  },
  interactButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  interactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});