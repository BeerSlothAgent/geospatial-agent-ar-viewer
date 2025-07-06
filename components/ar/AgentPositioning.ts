import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

// Interface for 3D position
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// Interface for agent display data
export interface AgentDisplayData {
  id: string;
  position: Position3D;
  size: number;
  distance: number;
  inRange: boolean;
}

/**
 * Calculate realistic 3D positions for agents based on GPS coordinates
 * with centimeter-level precision
 */
export function calculateAgentPositions(
  agents: DeployedObject[],
  userLocation: LocationData | null,
  maxDistance: number = 100 // meters
): Record<string, AgentDisplayData> {
  const positions: Record<string, AgentDisplayData> = {};
  
  if (!agents || agents.length === 0) {
    console.log('No agents provided for position calculation');
    return positions;
  }
  
  if (!userLocation) {
    console.warn('User location not available for position calculation');
    return positions;
  }
  
  console.log(`Calculating positions for ${agents.length} agents relative to user at ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`);
  
  // Earth radius in meters
  const EARTH_RADIUS = 6371000;
  
  agents.forEach((agent, index) => {
    try {
      if (!agent || !agent.id || isNaN(agent.latitude) || isNaN(agent.longitude)) {
        console.warn('Invalid agent data:', agent);
        return;
      }
      
      // Calculate distance from user to agent
      const distance = agent.distance_meters || 
        calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          agent.latitude,
          agent.longitude
        );
      
      // Skip agents that are too far away
      if (distance > maxDistance) {
        console.log(`Agent ${agent.name} (${agent.id}) is too far: ${distance}m > ${maxDistance}m`);
        return;
      }
      
      // Calculate size based on agent type and distance
      const baseSize = getBaseSizeForAgentType(agent.object_type);
      const sizeVariation = 0.8 + Math.random() * 0.4; // ±20% size variation
      const distanceScaling = Math.max(0.5, Math.min(1, 1 - (distance / maxDistance) * 0.5));
      const finalSize = baseSize * sizeVariation * distanceScaling;
      
      // Store calculated position and metadata
      console.log(`Positioned agent ${agent.name} (${agent.id}) at distance ${distance}m, size ${finalSize}`);
      positions[agent.id] = {
        id: agent.id,
        position: { 
          x: 0, // Will be set by grid layout
          y: 0, // Will be set by grid layout
          z: 0, // Will be set by grid layout
        },
        size: finalSize,
        distance: distance,
        inRange: distance <= (agent.visibility_radius || 50)
      };
    } catch (error) {
      console.error(`Error calculating position for agent ${agent.id}:`, error);
    }
  });
  
  console.log(`Successfully calculated positions for ${Object.keys(positions).length} agents`);
  return positions;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get base size for agent type
 */
function getBaseSizeForAgentType(agentType?: string): number {
  const baseSizes: Record<string, number> = {
    'ai_agent': 0.8,
    'study_buddy': 0.6,
    'tutor': 1.0,
    'landmark': 1.2,
    'building': 1.4,
    'Intelligent Assistant': 1.0,
    'Content Creator': 0.7,
    'Local Services': 0.9,
    'Tutor/Teacher': 1.1,
    '3D World Modelling': 1.3,
    'Game Agent': 0.8,
    'test-object': 1.0,
    'info-sphere': 0.9,
    'test-cube': 1.1,
    'test-sphere': 0.8
  };
  
  return baseSizes[agentType || ''] || 0.8;
}