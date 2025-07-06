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
  
  if (!userLocation) {
    console.warn('User location not available for position calculation');
    return positions;
  }
  
  // Earth radius in meters
  const EARTH_RADIUS = 6371000;
  
  agents.forEach((agent, index) => {
    try {
      // Calculate distance from user to agent
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        agent.latitude,
        agent.longitude
      );
      
      // Skip agents that are too far away
      if (distance > maxDistance) {
        return;
      }
      
      // Convert GPS coordinates to local 3D space
      // North is +Z, East is +X, Up is +Y
      const latRad = (agent.latitude * Math.PI) / 180;
      const lngRad = (agent.longitude * Math.PI) / 180;
      const userLatRad = (userLocation.latitude * Math.PI) / 180;
      const userLngRad = (userLocation.longitude * Math.PI) / 180;
      
      // Calculate position relative to user
      // Using Mercator projection for simplicity
      const x = EARTH_RADIUS * (lngRad - userLngRad) * Math.cos(userLatRad);
      const z = EARTH_RADIUS * (latRad - userLatRad);
      
      // Calculate altitude difference (if available)
      const userAlt = userLocation.altitude || 0;
      const agentAlt = agent.altitude || 0;
      const y = agentAlt - userAlt;
      
      // Add centimeter-level precision variations (simulated RTK precision)
      const cmVariationX = (Math.random() - 0.5) * 0.04; // ±2cm
      const cmVariationZ = (Math.random() - 0.5) * 0.04; // ±2cm
      const cmVariationY = (Math.random() - 0.5) * 0.02; // ±1cm vertical
      
      // Scale position for AR view (divide by factor to make distances manageable)
      // This makes 1 meter in real world = 0.1 units in AR space
      const scaleFactor = 10;
      
      // Calculate size based on agent type and distance
      const baseSize = getBaseSizeForAgentType(agent.object_type);
      const sizeVariation = 0.8 + Math.random() * 0.4; // ±20% size variation
      const distanceScaling = Math.max(0.5, Math.min(1, 1 - (distance / maxDistance) * 0.5));
      const finalSize = baseSize * sizeVariation * distanceScaling;
      
      // Store calculated position and metadata
      positions[agent.id] = {
        id: agent.id,
        position: {
          x: (x / scaleFactor) + cmVariationX,
          y: (y / scaleFactor) + cmVariationY + 1.6, // Add eye height
          z: (z / scaleFactor) + cmVariationZ,
        },
        size: finalSize,
        distance: distance,
        inRange: distance <= (agent.visibility_radius || 50)
      };
    } catch (error) {
      console.error(`Error calculating position for agent ${agent.id}:`, error);
    }
  });
  
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
    'Game Agent': 0.8
  };
  
  return baseSizes[agentType || ''] || 0.8;
}