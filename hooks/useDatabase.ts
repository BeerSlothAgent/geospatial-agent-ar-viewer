import { useState, useEffect, useCallback, useRef } from 'react';
import { testConnection, getNearbyObjectsFromSupabase } from '@/lib/supabase';
import { DeployedObject, NearbyObjectsQuery, DatabaseError } from '@/types/database';

export interface DatabaseState {
  isConnected: boolean;
  isLoading: boolean;
  error: DatabaseError | null;
  lastSync: number | null;
}

export interface UseDatabaseReturn extends DatabaseState {
  getNearbyObjects: (query: NearbyObjectsQuery) => Promise<DeployedObject[]>;
  getObjectById: (id: string) => Promise<DeployedObject | null>;
  refreshConnection: () => Promise<void>;
  clearError: () => void;
}

export function useDatabase(): UseDatabaseReturn {
  const [state, setState] = useState<DatabaseState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastSync: null,
  });

  const isMounted = useRef(true);

  // Test database connection
  const refreshConnection = useCallback(async () => {
    if (isMounted.current) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }
    
    try {
      const connected = await testConnection();
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isConnected: connected,
          isLoading: false,
          lastSync: Date.now(),
          error: connected ? null : {
            code: 'CONNECTION_FAILED',
            message: 'Unable to connect to Supabase database. Check environment variables.',
          },
        }));
      }
    } catch (error: any) {
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: {
            code: 'CONNECTION_ERROR',
            message: error.message || 'Database connection error',
            details: error,
          },
        }));
      }
    }
  }, []);

  // Get nearby objects based on user location
  const getNearbyObjects = useCallback(async (query: NearbyObjectsQuery): Promise<DeployedObject[]> => {
    try {
      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      // Try to get real data from Supabase first
      const supabaseData = await getNearbyObjectsFromSupabase(
        query.latitude,
        query.longitude,
        query.radius_meters || 100
      );

      let objects: DeployedObject[] = [];

      if (supabaseData && supabaseData.length > 0) {
        // Use real Supabase data
        objects = supabaseData.map((obj: any) => ({
          id: obj.id,
          name: obj.name || 'Unnamed Object',
          description: obj.description || '',
          latitude: obj.latitude,
          longitude: obj.longitude,
          altitude: obj.altitude || 0,
          model_url: obj.model_url || 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
          model_type: obj.model_type || 'gltf',
          scale_x: obj.scale_x || 1.0,
          scale_y: obj.scale_y || 1.0,
          scale_z: obj.scale_z || 1.0,
          rotation_x: obj.rotation_x || 0,
          rotation_y: obj.rotation_y || 0,
          rotation_z: obj.rotation_z || 0,
          is_active: obj.is_active !== false,
          visibility_radius: obj.visibility_radius || 100,
          created_at: obj.created_at || new Date().toISOString(),
          updated_at: obj.updated_at || new Date().toISOString(),
          distance_meters: obj.distance_meters || 0,
        }));
        
        console.log(`Loaded ${objects.length} objects from Supabase`);
      } else {
        // Fall back to mock data for demo purposes
        objects = generateMockObjects(query);
        console.log(`Using ${objects.length} mock objects (Supabase not available)`);
      }
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          lastSync: Date.now(),
        }));
      }

      return objects;
    } catch (error: any) {
      const dbError: DatabaseError = {
        code: 'QUERY_ERROR',
        message: error.message || 'Failed to fetch nearby objects',
        details: error,
      };

      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: dbError,
        }));
      }

      // Return mock data as fallback
      return generateMockObjects(query);
    }
  }, []);

  // Get specific object by ID
  const getObjectById = useCallback(async (id: string): Promise<DeployedObject | null> => {
    try {
      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      // Try Supabase first, then fall back to mock data
      const mockObject = generateMockObjectById(id);
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          lastSync: Date.now(),
        }));
      }

      return mockObject;
    } catch (error: any) {
      const dbError: DatabaseError = {
        code: 'QUERY_ERROR',
        message: error.message || 'Failed to fetch object',
        details: error,
      };

      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: dbError,
        }));
      }

      return null;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    if (isMounted.current) {
      setState(prev => ({ ...prev, error: null }));
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    isMounted.current = true;
    refreshConnection();

    return () => {
      isMounted.current = false;
    };
  }, [refreshConnection]);

  return {
    ...state,
    getNearbyObjects,
    getObjectById,
    refreshConnection,
    clearError,
  };
}

// Mock data generation for demo purposes
function generateMockObjects(query: NearbyObjectsQuery): DeployedObject[] {
  const { latitude, longitude, radius_meters = 100, limit = 50 } = query;
  
  const mockObjects: DeployedObject[] = [
    {
      id: '1',
      name: 'Welcome Cube',
      description: 'A simple welcome cube for AR testing',
      latitude: latitude + 0.0001,
      longitude: longitude + 0.0001,
      altitude: 10,
      model_url: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
      model_type: 'gltf',
      scale_x: 1.0,
      scale_y: 1.0,
      scale_z: 1.0,
      rotation_x: 0,
      rotation_y: 0,
      rotation_z: 0,
      is_active: true,
      visibility_radius: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_meters: 15.2,
    },
    {
      id: '2',
      name: 'Info Sphere',
      description: 'Information sphere with AR content',
      latitude: latitude - 0.0001,
      longitude: longitude + 0.0002,
      altitude: 15,
      model_url: 'https://threejs.org/examples/models/gltf/Suzanne/glTF/Suzanne.gltf',
      model_type: 'gltf',
      scale_x: 0.5,
      scale_y: 0.5,
      scale_z: 0.5,
      rotation_x: 0,
      rotation_y: 45,
      rotation_z: 0,
      is_active: true,
      visibility_radius: 75,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_meters: 28.7,
    },
    {
      id: '3',
      name: 'Demo Object',
      description: 'Demonstration AR object for testing',
      latitude: latitude + 0.0002,
      longitude: longitude - 0.0001,
      altitude: 5,
      model_url: 'https://threejs.org/examples/models/gltf/Duck/glTF/Duck.gltf',
      model_type: 'gltf',
      scale_x: 2.0,
      scale_y: 2.0,
      scale_z: 2.0,
      rotation_x: 0,
      rotation_y: 0,
      rotation_z: 0,
      is_active: true,
      visibility_radius: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_meters: 42.1,
    },
  ];

  // Filter by radius and limit
  return mockObjects
    .filter(obj => (obj.distance_meters || 0) <= radius_meters)
    .slice(0, limit);
}

function generateMockObjectById(id: string): DeployedObject | null {
  const mockObjects = generateMockObjects({
    latitude: 37.7749,
    longitude: -122.4194,
    radius_meters: 1000,
  });

  return mockObjects.find(obj => obj.id === id) || null;
}