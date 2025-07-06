import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

export class RangeDetectionService {
  private static instance: RangeDetectionService;
  private agents: DeployedObject[] = [];
  private userLocation: LocationData | null = null;
  private callbacks: ((agentsInRange: DeployedObject[]) => void)[] = [];

  static getInstance(): RangeDetectionService {
    if (!RangeDetectionService.instance) {
      RangeDetectionService.instance = new RangeDetectionService();
    }
    return RangeDetectionService.instance;
  }

  // Calculate distance between two points in meters
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Validate inputs to prevent NaN results
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
        typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      console.warn('Invalid coordinates in distance calculation:', { lat1, lon1, lat2, lon2 });
      return 999999; // Return a large distance for invalid coordinates
    }
    
   if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
     console.warn('Invalid coordinates in distance calculation:', { lat1, lon1, lat2, lon2 });
     return 999999; // Return a large distance for invalid coordinates
   }
   
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Update user location and check for agents in range
  updateUserLocation(location: LocationData): void {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.warn('Invalid location data provided to RangeDetectionService:', location);
      return;
    }
    
   if (!location || isNaN(location.latitude) || isNaN(location.longitude)) {
     console.warn('Invalid location data provided to RangeDetectionService:', location);
     return;
   }
   
    this.userLocation = location;
    this.checkAgentsInRange();
  }

  // Update agents list
  updateAgents(agents: DeployedObject[]): void {
    if (!Array.isArray(agents)) {
      console.warn('Invalid agents data provided to RangeDetectionService:', agents);
      return;
    }
    
   if (!agents || !Array.isArray(agents)) {
     console.warn('Invalid agents data provided to RangeDetectionService:', agents);
     return;
   }
   
    this.agents = agents;
    this.checkAgentsInRange();
  }

  // Check which agents are in range
  private checkAgentsInRange(): void {
    if (!this.userLocation || this.agents.length === 0) {
      this.notifyCallbacks([]);
      return;
    }

    const agentsInRange = this.agents.filter(agent => {
      if (!agent || typeof agent.latitude !== 'number' || typeof agent.longitude !== 'number') {
        console.warn('Invalid agent data in range check:', agent);
        return false;
      }
      
      const distance = this.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        agent.latitude,
        agent.longitude
      );

      // Use agent's visibility_radius or default to 50m
      const agentRange = typeof agent.visibility_radius === 'number' ? agent.visibility_radius : 50;
      return distance <= agentRange;
    });

    console.log(`🔍 Found ${agentsInRange.length} agents in range out of ${this.agents.length} total agents`);
    this.notifyCallbacks(agentsInRange);
  }

  // Subscribe to range updates
  subscribe(callback: (agentsInRange: DeployedObject[]) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Notify all subscribers
  private notifyCallbacks(agentsInRange: DeployedObject[]): void {
    this.callbacks.forEach(callback => callback(agentsInRange));
  }

  // Get current agents in range
  getCurrentAgentsInRange(): DeployedObject[] {
    if (!this.userLocation || this.agents.length === 0) {
      return [];
    }
    
    return this.agents.filter(agent => {
      if (!agent || typeof agent.latitude !== 'number' || typeof agent.longitude !== 'number') {
        return false;
      }
      
      const distance = this.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        agent.latitude,
        agent.longitude
      );

      const agentRange = typeof agent.visibility_radius === 'number' ? agent.visibility_radius : 50;
      return distance <= agentRange;
    });
  }

  // Get distance to specific agent
  getDistanceToAgent(agent: DeployedObject): number | null {
    if (!this.userLocation) return null;
    if (!agent || typeof agent.latitude !== 'number' || typeof agent.longitude !== 'number') {
      return null;
    }

    return this.calculateDistance(
      this.userLocation.latitude,
      this.userLocation.longitude,
      agent.latitude,
      agent.longitude
    );
  }
}