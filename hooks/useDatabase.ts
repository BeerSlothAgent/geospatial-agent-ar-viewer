import { useState, useEffect, useCallback, useRef } from 'react';
import { testConnection, isSupabaseConfigured, supabase } from '@/lib/supabase';
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

  // Get nearby objects using ONLY direct queries (no RPC)
  const getNearbyObjects = useCallback(async (query: NearbyObjectsQuery): Promise<DeployedObject[]> => {
    try {
      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      console.log('🔄 Fetching objects using direct query (no RPC)...', query);

      // COMPLETELY BYPASS RPC - Use direct table query only
      const objects = await fetchObjectsDirectly(query);
      
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

      // Try direct query first
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('deployed_objects')
          .select(`
            id,
            name,
            description,
            latitude,
            longitude,
            altitude,
            object_type,
            user_id,
            created_at
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (!error && data) {
          const transformedObject = transformDatabaseObject(data);
          
          if (isMounted.current) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              lastSync: Date.now(),
            }));
          }

          return transformedObject;
        }
      }

      // Fallback to mock data
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

// Direct database query function (NO RPC)
async function fetchObjectsDirectly(query: NearbyObjectsQuery): Promise<DeployedObject[]> {
  const { latitude, longitude, radius_meters = 100, limit = 50 } = query;

  // If Supabase is not configured, return mock data
  if (!supabase || !isSupabaseConfigured) {
    console.log('⚠️ Supabase not configured, using mock data');
    return generateMockObjects(query);
  }

  try {
    console.log('🔍 Querying database directly (no RPC)...');
    
    // Use direct table query with only guaranteed columns
    const { data, error } = await supabase
      .from('deployed_objects')
      .select(`
        id,
        name,
        description,
        latitude,
        longitude,
        altitude,
        object_type,
        user_id,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get more to filter by distance

    if (error) {
      console.error('❌ Direct query failed:', error);
      throw error;
    }

    console.log('✅ Direct query successful, found:', data?.length || 0, 'total objects');
    
    // Process and filter data client-side
    let processedData = (data || []).map(item => transformDatabaseObject(item));
    
    // Calculate distance and filter by proximity
    processedData = processedData
      .map(item => ({
        ...item,
        distance_meters: calculateDistance(
          latitude,
          longitude,
          item.latitude,
          item.longitude
        ) * 1000 // Convert km to meters
      }))
      .filter(item => item.distance_meters <= radius_meters)
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, limit);
    
    console.log('📍 Found', processedData.length, 'objects within', radius_meters, 'meters');
    
    return processedData;

  } catch (error) {
    console.error('❌ Direct query error:', error);
    
    // Return mock data as fallback
    console.log('🔄 Using mock data as fallback');
    return generateMockObjects(query);
  }
}

// Transform database object to include all required fields
function transformDatabaseObject(obj: any): DeployedObject {
  return {
    id: obj.id,
    name: obj.name || 'Unnamed Object',
    description: obj.description || '',
    latitude: parseFloat(obj.latitude),
    longitude: parseFloat(obj.longitude),
    altitude: parseFloat(obj.altitude || 0),
    model_url: getReliableModelUrl(obj.object_type || 'sphere'),
    model_type: obj.object_type || 'sphere',
    scale_x: 1.0,
    scale_y: 1.0,
    scale_z: 1.0,
    rotation_x: 0.0,
    rotation_y: 0.0,
    rotation_z: 0.0,
    is_active: true,
    visibility_radius: 50,
    created_at: obj.created_at || new Date().toISOString(),
    updated_at: obj.created_at || new Date().toISOString(), // Use created_at as fallback
    distance_meters: 0, // Will be calculated
  };
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get reliable model URLs that actually exist
function getReliableModelUrl(modelType: string): string {
  // Use simple geometric shapes that are guaranteed to work
  const reliableModels = {
    sphere: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sphere/glTF/Sphere.gltf',
    cube: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
    duck: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
    cylinder: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf', // Use box as fallback
    default: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf'
  };

  return reliableModels[modelType as keyof typeof reliableModels] || reliableModels.default;
}

// Mock data generation for demo purposes with reliable model URLs
function generateMockObjects(query: NearbyObjectsQuery): DeployedObject[] {
  const { latitude, longitude, radius_meters = 100, limit = 50 } = query;
  
  const mockObjects: DeployedObject[] = [
    {
      id: 'mock-1',
      name: 'Demo AR Cube',
      description: 'A demonstration AR cube for testing the AR viewer',
      latitude: latitude + 0.0001,
      longitude: longitude + 0.0001,
      altitude: 10,
      model_url: getReliableModelUrl('cube'),
      model_type: 'cube',
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
      name: 'Info Sphere',
      description: 'Information sphere with AR content',
      latitude: latitude - 0.0001,
      longitude: longitude + 0.0002,
      altitude: 15,
      model_url: getReliableModelUrl('sphere'),
      model_type: 'sphere',
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
      name: 'Test Duck',
      description: 'Test AR duck object for demonstration',
      latitude: latitude + 0.0002,
      longitude: longitude - 0.0001,
      altitude: 5,
      model_url: getReliableModelUrl('duck'),
      model_type: 'duck',
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