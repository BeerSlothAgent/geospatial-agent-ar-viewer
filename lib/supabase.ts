import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Environment variables for Supabase connection
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
});

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    // Check if environment variables are set
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not set, using demo mode');
      return false;
    }

    // Test actual connection to Supabase
    const { data, error } = await supabase
      .from('deployed_objects')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('No Supabase credentials, returning mock data');
      return null;
    }

    // Use Supabase RPC function for geospatial queries
    const { data, error } = await supabase
      .rpc('get_nearby_objects', {
        user_lat: latitude,
        user_lng: longitude,
        radius_meters: radius
      });

    if (error) {
      console.error('Error fetching objects from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getNearbyObjectsFromSupabase:', error);
    return null;
  }
};

// Health check function
export const getConnectionStatus = async (): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Check if environment variables are set
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        connected: false,
        error: 'Supabase environment variables not configured',
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