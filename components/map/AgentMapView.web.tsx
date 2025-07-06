import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Camera, X, Navigation, ArrowLeft } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import { RangeDetectionService } from '@/services/RangeDetectionService';

// Use Mapbox token from environment variables
const MAPBOX_TOKEN = 'pk.eyJ1IjoicGV0ZXJkZXYyMDI1IiwiYSI6ImNtN2h4c2x2MzE5eTAyanF3eXptMWs1b20ifQ.7_tGIKQZz3dBsZzTAmTluQ';

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
  const [viewState, setViewState] = useState({
    longitude: userLocation.longitude,
    latitude: userLocation.latitude,
    zoom: 16
  });
  
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

  // Get agent marker color based on type
  const getAgentMarkerColor = (agentType: string): string => {
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

  // Handle agent marker press
  const handleAgentPress = (agent: DeployedObject) => {
    setSelectedAgent(agent);
    if (onAgentSelect) {
      onAgentSelect(agent);
    }
  };

  // Create circle data for agent ranges
  const createCircleData = (agent: DeployedObject) => {
    const center = [agent.longitude, agent.latitude];
    const radius = agent.visibility_radius || 50;
    const points = 64;
    const coordinates = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radius * Math.cos(angle) / 111320; // Convert meters to degrees
      const dy = radius * Math.sin(angle) / 111320;
      coordinates.push([center[0] + dx, center[1] + dy]);
    }
    coordinates.push(coordinates[0]); // Close the circle
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      properties: {
        agentId: agent.id,
        color: getAgentMarkerColor(agent.object_type)
      }
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
      <View style={styles.mapContainer}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v10"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {/* User Location Marker */}
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="bottom"
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>

          {/* Agent Range Circles */}
          {agents.map((agent) => {
            const circleData = createCircleData(agent);
            return (
              <Source key={`circle-${agent.id}`} id={`circle-${agent.id}`} type="geojson" data={circleData as any}>
                <Layer
                  id={`circle-fill-${agent.id}`}
                  type="fill"
                  paint={{
                    'fill-color': circleData.properties.color,
                    'fill-opacity': 0.1
                  }}
                />
                <Layer
                  id={`circle-stroke-${agent.id}`}
                  type="line"
                  paint={{
                    'line-color': circleData.properties.color,
                    'line-width': 2,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            );
          })}

          {/* Agent Markers */}
          {agents.map((agent) => {
            const distance = rangeService.getDistanceToAgent(agent);
            const inRange = distance !== null && distance <= (agent.visibility_radius || 50);
            
            return (
              <Marker
                key={agent.id}
                longitude={agent.longitude}
                latitude={agent.latitude}
                anchor="bottom"
                onClick={() => handleAgentPress(agent)}
              >
                <View style={[
                  styles.agentMarker,
                  { backgroundColor: getAgentMarkerColor(agent.object_type) }
                ]}>
                  <Text style={styles.agentMarkerText}>
                    {agent.object_type.charAt(0)}
                  </Text>
                </View>
                <View style={styles.agentLabel}>
                  <Text style={styles.agentLabelText}>{agent.name}</Text>
                  <Text style={styles.agentDistance}>
                    {distance ? Math.round(distance) : '?'}m
                  </Text>
                </View>
              </Marker>
            );
          })}
        </Map>
      </View>

      {/* Bottom Info Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{agentsInRange.length}</Text>
            <Text style={styles.statLabel}>In Range</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{agents.length}</Text>
            <Text style={styles.statLabel}>Total Agents</Text>
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

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#00d4ff' }]} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.legendText}>Agent Location</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendCircle, { borderColor: '#6B7280' }]} />
            <Text style={styles.legendText}>Interaction Range</Text>
          </View>
        </View>
      </View>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00d4ff',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    margin: 3,
  },
  agentMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  agentMarkerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  agentLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agentLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  agentDistance: {
    fontSize: 10,
    color: '#6B7280',
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
  legend: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 10,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: '#aaa',
  },
});