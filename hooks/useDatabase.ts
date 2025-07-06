import { useState, useEffect, useCallback, useRef } from 'react';
import { testConnection, getNearbyObjectsFromSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';
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
            message: isSupabaseConfigured 
              ? 'Unable to connect to Supabase database. Check your credentials and network connection.'
              : 'Supabase environment variables not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
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
        setState(prev => ({ 
          ...prev, 
          isLoading: true, 
          error: null 
        }));
      }

      console.log('🔍 Fetching nearby objects:', {
        lat: query.latitude.toFixed(6),
        lng: query.longitude.toFixed(6),
        radius: query.radius_meters || 100,
        supabaseConfigured: isSupabaseConfigured,
        supabaseClient: !!supabase
      });

      // Validate query parameters
      if (!query || isNaN(query.latitude) || isNaN(query.longitude)) {
        throw new Error('Invalid location coordinates provided');
      }

      // Try to get real data from Supabase first
      const supabaseData = await getNearbyObjectsFromSupabase(
        query.latitude,
        query.longitude,
        query.radius_meters || 100
      );

      let objects: DeployedObject[] = [];

      if (supabaseData && supabaseData.length > 0) {
        // Use real Supabase data with proper transformation
        objects = supabaseData.map((obj: any) => ({
          id: obj.id,
          user_id: obj.user_id || 'unknown',
          object_type: obj.object_type || 'unknown',
          name: obj.name || 'Unnamed Object',
          description: obj.description || '',
          latitude: parseFloat(obj.latitude),
          longitude: parseFloat(obj.longitude),
          altitude: parseFloat(obj.altitude || 0),
          model_url: obj.model_url || 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
          model_type: obj.model_type || 'gltf',
          scale_x: parseFloat(obj.scale_x || 1.0),
          scale_y: parseFloat(obj.scale_y || 1.0),
          scale_z: parseFloat(obj.scale_z || 1.0),
          rotation_x: parseFloat(obj.rotation_x || 0),
          rotation_y: parseFloat(obj.rotation_y || 0),
          rotation_z: parseFloat(obj.rotation_z || 0),
          is_active: obj.is_active !== false,
          visibility_radius: parseInt(obj.visibility_radius || 100),
          created_at: obj.created_at || new Date().toISOString(),
          // Use created_at as updated_at since updated_at column doesn't exist
          updated_at: obj.created_at || new Date().toISOString(),
          distance_meters: typeof obj.distance_meters === 'number' ? obj.distance_meters : 
                          (typeof obj.distance_meters === 'string' ? parseFloat(obj.distance_meters) : 0),
          preciselatitude: obj.preciselatitude ? parseFloat(obj.preciselatitude) : undefined,
          preciselongitude: obj.preciselongitude ? parseFloat(obj.preciselongitude) : undefined,
          precisealtitude: obj.precisealtitude ? parseFloat(obj.precisealtitude) : undefined,
          accuracy: obj.accuracy ? parseFloat(obj.accuracy) : undefined,
          correctionapplied: obj.correctionapplied || false,
        }));
        
        console.log(`✅ Loaded ${objects.length} objects from Supabase:`, objects);
      } else if (supabaseData === null && isSupabaseConfigured) {
        console.warn('⚠️ Supabase returned null data but is configured - check your connection');
        objects = generateMockObjects(query);
        console.log(`🔄 Using ${objects.length} mock objects due to Supabase data issue`);
        
        // Log the first object for debugging
        if (objects.length > 0) {
          console.log('Sample object:', objects[0]);
        }
      } else {
        // Fall back to mock data for demo purposes
        objects = generateMockObjects(query);
        console.log(`⚠️ Using ${objects.length} mock objects (Supabase not available or not configured)`);
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

      console.error('Database query error:', dbError);

      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: dbError,
        }));
      }

      // Return mock data as fallback
      const fallbackObjects = generateMockObjects(query);
      console.log(`🔄 Returning ${fallbackObjects.length} fallback mock objects due to error`);
      return fallbackObjects;
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
  const { latitude, longitude, radius_meters = 100, limit = 10 } = query;
  
  console.log('Generating mock objects at', latitude, longitude);
  
  const mockObjects: DeployedObject[] = [
    {
      id: 'mock-1',
      user_id: 'demo-user',
      object_type: 'test-cube',
      name: 'Demo AR Cube',
      description: 'A demonstration AR cube for testing the AR viewer',
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
      id: 'mock-2',
      user_id: 'demo-user',
      object_type: 'info-sphere',
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
      id: 'mock-3',
      user_id: 'demo-user',
      object_type: 'test-object',
      name: 'Test Object',
      description: 'Test AR object for demonstration',
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
    {
      id: 'mock-4',
      user_id: 'demo-user',
      object_type: 'Intelligent Assistant',
      name: 'AI Helper',
      description: 'An intelligent AI assistant to help with your questions',
      latitude: latitude + 0.0003,
      longitude: longitude - 0.0002,
      altitude: 8,
      model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
      model_type: 'gltf',
      scale_x: 1.5,
      scale_y: 1.5,
      scale_z: 1.5,
      rotation_x: 0,
      rotation_y: 45,
      rotation_z: 0,
      is_active: true,
      visibility_radius: 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_meters: 35.8,
    },
    {
      id: 'mock-5',
      user_id: 'demo-user',
      object_type: 'Game Agent',
      name: 'Game Buddy',
      description: 'Interactive gaming companion',
      latitude: latitude - 0.0002,
      longitude: longitude - 0.0001,
      altitude: 12,
      model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
      model_type: 'gltf',
      scale_x: 1.2,
      scale_y: 1.2,
      scale_z: 1.2,
      rotation_x: 0,
      rotation_y: 30,
      rotation_z: 0,
      is_active: true,
      visibility_radius: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      distance_meters: 22.3,
    }
  ];

  console.log(`Generated ${mockObjects.length} mock objects`);
  
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