import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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

// Declare global mapboxgl for TypeScript
declare global {
  interface Window {
    mapboxgl: any;
  }
}

export default function AgentMapView({
  userLocation,
  agents,
  onClose,
  onSwitchToCamera,
  onAgentSelect
}: AgentMapViewProps) {
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [agentsInRange, setAgentsInRange] = useState<DeployedObject[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  
  const rangeService = RangeDetectionService.getInstance();

  // Load Mapbox GL JS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Mapbox GL JS is already loaded
    if (window.mapboxgl) {
      setMapLoaded(true);
      return;
    }

    // Load Mapbox GL JS CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load Mapbox GL JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapContainer.current || map.current) return;

    // Add a small delay to ensure CSS styles are fully loaded
    setTimeout(() => {
      window.mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 16
      });

      // Add user location marker
      const userMarker = document.createElement('div');
      userMarker.className = 'user-marker';
      userMarker.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #00d4ff;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      new window.mapboxgl.Marker(userMarker)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    }, 100);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapLoaded, userLocation]);

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

  // Update agent markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add agent markers
    agents.forEach(agent => {
      const distance = rangeService.getDistanceToAgent(agent);
      const inRange = distance !== null && distance <= (agent.visibility_radius || 50);
      
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'agent-marker';
      markerEl.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: ${getAgentMarkerColor(agent.object_type)};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      markerEl.textContent = agent.object_type.charAt(0);

      // Create popup
      const popup = new window.mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #333;">${agent.name}</h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${agent.object_type}</p>
          ${agent.description ? `<p style="margin: 0 0 12px 0; color: #666; font-size: 12px;">${agent.description}</p>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="color: #666; font-size: 12px;">Distance: ${Math.round(distance || 0)}m</span>
            <span style="color: #666; font-size: 12px;">Range: ${agent.visibility_radius || 50}m</span>
          </div>
          <button 
            onclick="window.selectAgent('${agent.id}')"
            style="
              width: 100%;
              padding: 8px;
              background-color: #00d4ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 600;
            "
          >
            Interact
          </button>
        </div>
      `);

      // Add marker with popup
      const marker = new window.mapboxgl.Marker(markerEl)
        .setLngLat([agent.longitude, agent.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);

      // Add click handler
      markerEl.addEventListener('click', () => {
        setSelectedAgent(agent);
        if (onAgentSelect) {
          onAgentSelect(agent);
        }
      });

      // Add range circle
      if (map.current.getSource(`circle-${agent.id}`)) {
        map.current.removeLayer(`circle-fill-${agent.id}`);
        map.current.removeLayer(`circle-stroke-${agent.id}`);
        map.current.removeSource(`circle-${agent.id}`);
      }

      const circleData = createCircleData(agent);
      map.current.addSource(`circle-${agent.id}`, {
        type: 'geojson',
        data: circleData
      });

      map.current.addLayer({
        id: `circle-fill-${agent.id}`,
        type: 'fill',
        source: `circle-${agent.id}`,
        paint: {
          'fill-color': getAgentMarkerColor(agent.object_type),
          'fill-opacity': 0.1
        }
      });

      map.current.addLayer({
        id: `circle-stroke-${agent.id}`,
        type: 'line',
        source: `circle-${agent.id}`,
        paint: {
          'line-color': getAgentMarkerColor(agent.object_type),
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    });

    // Global function for popup interactions
    (window as any).selectAgent = (agentId: string) => {
      const agent = agents.find(a => a.id === agentId);
      if (agent && onAgentSelect) {
        onAgentSelect(agent);
      }
    };
  }, [agents, mapLoaded]);

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

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ 
          flex: 1, 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }} 
      />

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

      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading Map...</Text>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});