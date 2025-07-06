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
    this.userLocation = location;
    this.checkAgentsInRange();
  }

  // Update agents list
  updateAgents(agents: DeployedObject[]): void {
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
      const distance = this.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        agent.latitude,
        agent.longitude
      );

      // Use agent's visibility_radius or default to 50m
      const agentRange = agent.visibility_radius || 50;
      return distance <= agentRange;
    });

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
      const distance = this.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        agent.latitude,
        agent.longitude
      );

      const agentRange = agent.visibility_radius || 50;
      return distance <= agentRange;
    });
  }

  // Get distance to specific agent
  getDistanceToAgent(agent: DeployedObject): number | null {
    if (!this.userLocation) return null;

    return this.calculateDistance(
      this.userLocation.latitude,
      this.userLocation.longitude,
      agent.latitude,
      agent.longitude
    );
  }
}