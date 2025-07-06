import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Camera, MapPin, Zap, ArrowLeft } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { useDatabase } from '@/hooks/useDatabase';
import { RangeDetectionService } from '@/services/RangeDetectionService';
import { DeployedObject } from '@/types/database';
import { router } from 'expo-router';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [agents, setAgents] = useState<DeployedObject[]>([]);
  const [agentsInRange, setAgentsInRange] = useState<DeployedObject[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  
  // Location hook
  const {
    location,
    error: locationError,
    isLoading: locationLoading,
    hasPermission: hasLocationPermission,
    getCurrentPosition,
  } = useLocation({
    enableHighAccuracy: true,
    watchPosition: true,
  });
  
  // Database hook
  const {
    getNearbyObjects,
    isLoading: databaseLoading,
  } = useDatabase();
  
  // Range detection service
  const rangeService = RangeDetectionService.getInstance();
  
  // Load agents when location changes
  useEffect(() => {
    if (location) {
      loadAgents();
    }
  }, [location]);
  
  // Update range detection service
  useEffect(() => {
    if (location) {
      rangeService.updateUserLocation(location);
    }
    
    if (agents.length > 0) {
      rangeService.updateAgents(agents);
    }
    
    // Subscribe to range updates
    const unsubscribe = rangeService.subscribe((inRangeAgents) => {
      setAgentsInRange(inRangeAgents);
    });
    
    return unsubscribe;
  }, [agents, location]);
  
  // Load agents from database
  const loadAgents = async () => {
    if (!location) return;
    
    try {
      const objects = await getNearbyObjects({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_meters: 1000, // 1km radius
        limit: 50,
      });
      
      setAgents(objects);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };
  
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
  
  // Switch to camera/AR view
  const handleSwitchToCamera = () => {
    router.navigate('/');
  };
  
  // Render map placeholder (since we can't use react-native-maps in this environment)
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Agent Map</Text>
          <Text style={styles.headerSubtitle}>
            {agentsInRange.length} agent{agentsInRange.length !== 1 ? 's' : ''} in range
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleSwitchToCamera}
            style={styles.headerButton}
          >
            <Camera size={24} color="#00d4ff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          // For web, use Mapbox
          <iframe
            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/${location?.longitude || -122.4194},${location?.latitude || 37.7749},13,0/800x600?access_token=${MAPBOX_TOKEN}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Map"
          />
        ) : (
          // For native, show placeholder
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Map View</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              {location ? 
                `Your location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 
                'Location not available'}
            </Text>
          </View>
        )}
        
        {/* User location marker */}
        <View style={styles.userMarker}>
          <View style={styles.userMarkerDot} />
          <Text style={styles.userMarkerLabel}>You</Text>
        </View>
        
        {/* Agent markers */}
        {agents.map((agent, index) => {
          const distance = rangeService.getDistanceToAgent(agent) || 0;
          const inRange = distance <= (agent.visibility_radius || 50);
          
          // Calculate position (simplified for placeholder)
          const angle = (index / agents.length) * Math.PI * 2;
          const radius = Math.min(width, height) * 0.3 * (distance / 100 + 0.5);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.agentMarker,
                {
                  transform: [
                    { translateX: x },
                    { translateY: y }
                  ],
                  backgroundColor: getAgentColor(agent.object_type),
                  opacity: inRange ? 1 : 0.5,
                }
              ]}
              onPress={() => setSelectedAgent(agent)}
            >
              <Text style={styles.agentMarkerLabel}>{agent.name}</Text>
              <View style={[
                styles.agentRange,
                { 
                  borderColor: getAgentColor(agent.object_type),
                  width: (agent.visibility_radius || 50) / 5,
                  height: (agent.visibility_radius || 50) / 5,
                }
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>
      
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
          onPress={handleSwitchToCamera}
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
              <MapPin size={14} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.agentInfoDetailText}>
                Distance: {Math.round(rangeService.getDistanceToAgent(selectedAgent) || 0)}m
              </Text>
            </View>
            <View style={styles.agentInfoDetail}>
              <Zap size={14} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.agentInfoDetailText}>
                Range: {selectedAgent.visibility_radius || 50}m
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.interactButton}
            onPress={() => {
              setSelectedAgent(null);
              handleSwitchToCamera();
            }}
          >
            <Text style={styles.interactButtonText}>View in AR</Text>
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
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    position: 'absolute',
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#666',
    position: 'absolute',
    top: 50,
  },
  userMarker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00d4ff',
    borderWidth: 2,
    borderColor: 'white',
  },
  userMarkerLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  agentMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    left: '50%',
    top: '50%',
    transform: [{ translateX: -8 }, { translateY: -8 }],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 1,
  },
  agentMarkerLabel: {
    position: 'absolute',
    top: 18,
    left: -20,
    width: 60,
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  agentRange: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.3,
    transform: [{ translateX: -50 }, { translateY: -50 }],
    left: '50%',
    top: '50%',
  },
  bottomPanel: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    zIndex: 10,
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