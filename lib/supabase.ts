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
      console.warn('Supabase environment variables not set or invalid, using demo mode');
      return false;
    }

    if (!supabase) {
      console.warn('Supabase client not initialized');
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
    if (!hasValidCredentials || !supabase) {
      console.warn('No valid Supabase credentials, returning mock data');
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