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

    // Test actual connection to Supabase
    const { data, error } = await supabase
      .from('deployed_objects')
      .select('count', { count: 'exact', head: true });
    
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

// Get nearby objects from Supabase
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

    // First try using RPC function if it exists
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_nearby_objects', {
          user_lat: latitude,
          user_lng: longitude,
          radius_meters: radius
        });

      if (!rpcError && rpcData) {
        console.log(`✅ Found ${rpcData.length} objects using RPC function`);
        return rpcData;
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, using direct query');
    }

    // Fallback to direct query with PostGIS if RPC function doesn't exist
    const { data, error } = await supabase
      .from('deployed_objects')
      .select(`
        id,
        name,
        description,
        latitude,
        longitude,
        altitude,
        model_url,
        model_type,
        scale_x,
        scale_y,
        scale_z,
        rotation_x,
        rotation_y,
        rotation_z,
        is_active,
        visibility_radius,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .limit(50);

    if (error) {
      console.error('❌ Error fetching objects from Supabase:', error);
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
        distance_meters: distance
      };
    }).filter(obj => obj.distance_meters <= radius) || [];

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

    // Test connection
    const { error } = await supabase
      .from('deployed_objects')
      .select('count', { count: 'exact', head: true });
    
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