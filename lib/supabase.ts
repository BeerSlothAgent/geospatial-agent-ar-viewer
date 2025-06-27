import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Environment variables for Supabase connection
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we have valid Supabase credentials
const hasValidCredentials = SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'your_supabase_project_url_here' &&
  SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here' &&
  SUPABASE_URL.startsWith('https://');

// Create Supabase client only if we have valid credentials
export const supabase = hasValidCredentials ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // For this standalone AR viewer, we'll use anonymous access
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    // Enable real-time subscriptions for object updates
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': `ar-viewer-${Platform.OS}`,
    },
  },
}) : null;

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    // Check if environment variables are set
    if (!hasValidCredentials) {
      console.warn('⚠️ Supabase environment variables not set or invalid, using demo mode');
      return false;
    }

    if (!supabase) {
      console.warn('⚠️ Supabase client not initialized');
      return false;
    }

    console.log('🔗 Testing Supabase connection...');

    // Test actual connection to Supabase with only guaranteed columns
    const { data, error } = await supabase
      .from('deployed_objects')
      .select('id, name, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
};

// Get nearby objects from Supabase with robust error handling
export const getNearbyObjectsFromSupabase = async (
  latitude: number,
  longitude: number,
  radius: number = 100
) => {
  try {
    // Check if we have valid Supabase credentials
    if (!hasValidCredentials || !supabase) {
      console.warn('⚠️ No valid Supabase credentials, returning null');
      return null;
    }

    console.log(`🔍 Querying Supabase for objects near ${latitude.toFixed(6)}, ${longitude.toFixed(6)} within ${radius}m`);

    // First try using RPC function if it exists (without updated_at)
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_nearby_objects', {
          user_lat: latitude,
          user_lng: longitude,
          radius_meters: radius
        });

      if (!rpcError && rpcData) {
        console.log(`✅ Found ${rpcData.length} objects using RPC function`);
        // Transform RPC data to include updated_at = created_at
        return rpcData.map((obj: any) => ({
          ...obj,
          updated_at: obj.updated_at || obj.created_at, // Use created_at as fallback
        }));
      } else if (rpcError) {
        console.log('⚠️ RPC function failed:', rpcError.message);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, using direct query');
    }

    // Fallback to direct query - only select columns that exist in your schema
    console.log('🔄 Trying direct query...');
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
        created_at,
        preciselatitude,
        preciselongitude,
        precisealtitude,
        accuracy,
        correctionapplied,
        is_active,
        model_url,
        model_type,
        scale_x,
        scale_y,
        scale_z,
        rotation_x,
        rotation_y,
        rotation_z,
        visibility_radius
      `)
      .eq('is_active', true)
      .limit(50);

    if (error) {
      console.error('❌ Error fetching objects from Supabase:', error);
      
      // If the error is about missing columns, try an even more basic query
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('🔄 Trying minimal query with only core columns...');
        
        const { data: basicData, error: basicError } = await supabase
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
          .limit(50);

        if (basicError) {
          console.error('❌ Basic query also failed:', basicError);
          return null;
        }

        // Transform basic data to include defaults for missing columns
        const transformedData = basicData?.map(obj => ({
          ...obj,
          // Add missing columns with defaults
          preciselatitude: obj.latitude,
          preciselongitude: obj.longitude,
          precisealtitude: obj.altitude || 0,
          accuracy: null,
          correctionapplied: false,
          is_active: true,
          model_url: null,
          model_type: obj.object_type || 'sphere',
          scale_x: 1.0,
          scale_y: 1.0,
          scale_z: 1.0,
          rotation_x: 0.0,
          rotation_y: 0.0,
          rotation_z: 0.0,
          visibility_radius: 50.0,
          updated_at: obj.created_at, // Use created_at as updated_at fallback
          distance_meters: calculateDistance(latitude, longitude, obj.latitude, obj.longitude)
        })).filter(obj => obj.distance_meters <= radius) || [];

        console.log(`✅ Found ${transformedData.length} objects using minimal query`);
        return transformedData;
      }
      
      return null;
    }

    // Calculate distances manually and filter by radius
    const objectsWithDistance = data?.map(obj => {
      const distance = calculateDistance(
        latitude, longitude,
        obj.latitude, obj.longitude
      );
      return {
        ...obj,
        // Provide defaults for potentially missing columns
        model_url: obj.model_url || null,
        model_type: obj.model_type || obj.object_type || 'sphere',
        scale_x: obj.scale_x || 1.0,
        scale_y: obj.scale_y || 1.0,
        scale_z: obj.scale_z || 1.0,
        rotation_x: obj.rotation_x || 0.0,
        rotation_y: obj.rotation_y || 0.0,
        rotation_z: obj.rotation_z || 0.0,
        visibility_radius: obj.visibility_radius || 50.0,
        updated_at: obj.created_at, // Use created_at as updated_at fallback
        distance_meters: distance
      };
    }).filter(obj => (obj.distance_meters || 0) <= radius) || [];

    console.log(`✅ Found ${objectsWithDistance.length} objects using direct query`);
    return objectsWithDistance;

  } catch (error) {
    console.error('❌ Error in getNearbyObjectsFromSupabase:', error);
    return null;
  }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Health check function
export const getConnectionStatus = async (): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Check if environment variables are set
    if (!hasValidCredentials) {
      return {
        connected: false,
        error: 'Supabase environment variables not configured or invalid',
      };
    }

    if (!supabase) {
      return {
        connected: false,
        error: 'Supabase client not initialized',
      };
    }

    // Test connection with minimal query
    const { error } = await supabase
      .from('deployed_objects')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }

    return {
      connected: true,
      latency,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Connection failed',
    };
  }
};

// Export connection status for components to check
export const isSupabaseConfigured = hasValidCredentials;

// Debug function to check current configuration
export const debugSupabaseConfig = () => {
  console.log('🔧 Supabase Configuration Debug:');
  console.log('- URL configured:', !!SUPABASE_URL);
  console.log('- Key configured:', !!SUPABASE_ANON_KEY);
  console.log('- Valid credentials:', hasValidCredentials);
  console.log('- Client initialized:', !!supabase);
  
  if (hasValidCredentials) {
    console.log('- URL:', SUPABASE_URL);
    console.log('- Key length:', SUPABASE_ANON_KEY.length);
  }
};