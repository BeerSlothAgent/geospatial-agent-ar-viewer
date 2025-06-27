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

// Test connection function - NEVER use RPC
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

    console.log('🔗 Testing Supabase connection (direct query only)...');

    // Test actual connection to Supabase with minimal query
    const { data, error } = await supabase
      .from('deployed_objects')
      .select('id')
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

// REMOVED: All RPC function usage - using direct queries only
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

    console.log(`🔍 Querying Supabase directly (NO RPC) for objects near ${latitude.toFixed(6)}, ${longitude.toFixed(6)} within ${radius}m`);

    // ONLY use direct query - NO RPC function calls
    console.log('🔄 Using direct table query only...');
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
      .limit(100); // Get more objects to filter client-side

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
        // Provide defaults for potentially missing columns
        model_url: null, // Will be set by getReliableModelUrl
        model_type: obj.object_type || 'sphere',
        scale_x: 1.0,
        scale_y: 1.0,
        scale_z: 1.0,
        rotation_x: 0.0,
        rotation_y: 0.0,
        rotation_z: 0.0,
        visibility_radius: 50.0,
        updated_at: obj.created_at, // Use created_at as updated_at fallback
        distance_meters: distance * 1000 // Convert km to meters
      };
    }).filter(obj => (obj.distance_meters || 0) <= radius)
      .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0)) || [];

    console.log(`✅ Found ${objectsWithDistance.length} objects using direct query`);
    return objectsWithDistance;

  } catch (error) {
    console.error('❌ Error in getNearbyObjectsFromSupabase:', error);
    return null;
  }
};

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

// Health check function - NO RPC
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

    // Test connection with minimal query (NO RPC)
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
  console.log('- RPC functions: DISABLED (using direct queries only)');
  
  if (hasValidCredentials) {
    console.log('- URL:', SUPABASE_URL);
    console.log('- Key length:', SUPABASE_ANON_KEY.length);
  }
};