# API Documentation

## Overview

This document provides comprehensive API documentation for the Standalone Geospatial AR Viewer application. The API includes both internal endpoints and external service integrations.

## Base Configuration

### Environment Variables
```typescript
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PRECISE_LOCATION_API=your_location_api_url
```

### API Client Setup
```typescript
// api/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// HTTP client for external APIs
export const apiClient = {
  baseURL: process.env.EXPO_PUBLIC_PRECISE_LOCATION_API,
  timeout: 10000,
};
```

## Internal API Endpoints

### 1. Object Management

#### GET /api/objects/nearby

Retrieve AR objects near a specific location.

**Parameters:**
- `latitude` (number, required): User's latitude
- `longitude` (number, required): User's longitude  
- `radius` (number, optional): Search radius in meters (default: 100)
- `limit` (number, optional): Maximum number of objects to return (default: 50)

**Request:**
```typescript
const getNearbyObjects = async (
  latitude: number, 
  longitude: number, 
  radius: number = 100,
  limit: number = 50
) => {
  const { data, error } = await supabase
    .rpc('get_nearby_objects', {
      user_lat: latitude,
      user_lng: longitude,
      radius_meters: radius
    })
    .limit(limit);
    
  if (error) throw error;
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Test Cube",
      "description": "A simple test cube",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "altitude": 10.0,
      "model_url": "https://example.com/models/cube.gltf",
      "model_type": "gltf",
      "scale_x": 1.0,
      "scale_y": 1.0,
      "scale_z": 1.0,
      "rotation_x": 0.0,
      "rotation_y": 0.0,
      "rotation_z": 0.0,
      "visibility_radius": 100,
      "distance_meters": 25.5,
      "created_at": "2025-01-27T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COORDINATES",
    "message": "Invalid latitude or longitude values"
  }
}
```

#### GET /api/objects/:id

Get detailed information about a specific AR object.

**Parameters:**
- `id` (string, required): Object UUID

**Request:**
```typescript
const getObjectById = async (id: string) => {
  const { data, error } = await supabase
    .from('deployed_objects')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();
    
  if (error) throw error;
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Test Cube",
    "description": "A simple test cube for AR testing",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 10.0,
    "model_url": "https://example.com/models/cube.gltf",
    "model_type": "gltf",
    "scale_x": 1.0,
    "scale_y": 1.0,
    "scale_z": 1.0,
    "rotation_x": 0.0,
    "rotation_y": 0.0,
    "rotation_z": 0.0,
    "is_active": true,
    "visibility_radius": 100,
    "created_at": "2025-01-27T10:00:00Z",
    "updated_at": "2025-01-27T10:00:00Z"
  }
}
```

### 2. Session Management

#### POST /api/sessions/start

Start a new AR session.

**Request Body:**
```json
{
  "device_info": {
    "platform": "ios",
    "os_version": "17.0",
    "app_version": "1.0.0",
    "device_model": "iPhone 15 Pro",
    "screen_resolution": "1179x2556",
    "ar_capabilities": ["world_tracking", "face_tracking"]
  },
  "start_location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 10.0
  }
}
```

**Request:**
```typescript
const startARSession = async (sessionData: {
  device_info: DeviceInfo;
  start_location: GeographicPoint;
}) => {
  const { data, error } = await supabase
    .from('ar_sessions')
    .insert({
      device_info: sessionData.device_info,
      start_location: `POINT(${sessionData.start_location.longitude} ${sessionData.start_location.latitude})`,
      started_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "started_at": "2025-01-27T10:00:00Z",
    "device_info": { ... },
    "start_location": { ... }
  }
}
```

#### PUT /api/sessions/:id/end

End an AR session.

**Parameters:**
- `id` (string, required): Session UUID

**Request Body:**
```json
{
  "end_location": {
    "latitude": 37.7750,
    "longitude": -122.4195,
    "altitude": 12.0
  },
  "performance_metrics": {
    "avg_fps": 58.5,
    "memory_usage": 245.6,
    "battery_usage": 15.2,
    "network_requests": 12,
    "render_time_ms": 16.8
  },
  "objects_viewed": 5,
  "objects_interacted": 2
}
```

**Request:**
```typescript
const endARSession = async (sessionId: string, endData: {
  end_location: GeographicPoint;
  performance_metrics: PerformanceMetrics;
  objects_viewed: number;
  objects_interacted: number;
}) => {
  const endTime = new Date();
  const { data: session } = await supabase
    .from('ar_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();
    
  const duration = Math.floor(
    (endTime.getTime() - new Date(session.started_at).getTime()) / 1000
  );
  
  const { data, error } = await supabase
    .from('ar_sessions')
    .update({
      end_location: `POINT(${endData.end_location.longitude} ${endData.end_location.latitude})`,
      ended_at: endTime.toISOString(),
      session_duration: duration,
      performance_metrics: endData.performance_metrics,
      objects_viewed: endData.objects_viewed,
      objects_interacted: endData.objects_interacted
    })
    .eq('id', sessionId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

### 3. Interaction Tracking

#### POST /api/interactions

Log an interaction with an AR object.

**Request Body:**
```json
{
  "session_id": "session-uuid",
  "object_id": "object-uuid",
  "interaction_type": "tap",
  "interaction_data": {
    "tap_count": 1,
    "tap_force": 0.8
  },
  "user_location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 10.0
  },
  "distance_to_object": 25.5,
  "interaction_duration": 1500
}
```

**Request:**
```typescript
const logInteraction = async (interaction: {
  session_id: string;
  object_id: string;
  interaction_type: InteractionType;
  interaction_data?: Record<string, any>;
  user_location: GeographicPoint;
  distance_to_object: number;
  interaction_duration?: number;
}) => {
  const { data, error } = await supabase
    .from('object_interactions')
    .insert({
      ...interaction,
      user_location: `POINT(${interaction.user_location.longitude} ${interaction.user_location.latitude})`,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
```

## External API Integrations

### 1. Precise Location Service

#### GET /api/get-precise-location

Get high-accuracy GPS coordinates (from main AgentSphere project).

**Request:**
```typescript
const getPreciseLocation = async () => {
  try {
    const response = await fetch(`${apiClient.baseURL}/api/get-precise-location`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: apiClient.timeout,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Precise location error:', error);
    throw error;
  }
};
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": 37.774929,
    "longitude": -122.419416,
    "altitude": 10.5,
    "accuracy": 1.2,
    "timestamp": "2025-01-27T10:00:00Z",
    "source": "geodnet_corrected"
  }
}
```

### 2. Expo Location Services

#### getCurrentPositionAsync

Get device location using Expo Location.

**Request:**
```typescript
import * as Location from 'expo-location';

const getCurrentLocation = async (): Promise<GeographicPoint> => {
  // Request permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  
  // Get current position
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
    maximumAge: 10000, // 10 seconds
    timeout: 15000, // 15 seconds
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude || 0,
  };
};
```

#### watchPositionAsync

Watch for location changes.

**Request:**
```typescript
const watchLocation = async (callback: (location: GeographicPoint) => void) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  
  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000, // 5 seconds
      distanceInterval: 1, // 1 meter
    },
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude || 0,
      });
    }
  );
};
```

## Error Handling

### Error Types

```typescript
export enum APIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
}

export interface APIError {
  type: APIErrorType;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
```

### Error Handler

```typescript
export const handleAPIError = (error: any): APIError => {
  const timestamp = new Date().toISOString();
  
  if (error.code === 'PGRST116') {
    return {
      type: APIErrorType.NOT_FOUND,
      message: 'Resource not found',
      timestamp,
    };
  }
  
  if (error.message?.includes('Network')) {
    return {
      type: APIErrorType.NETWORK_ERROR,
      message: 'Network connection error',
      details: { originalError: error.message },
      timestamp,
    };
  }
  
  if (error.message?.includes('permission')) {
    return {
      type: APIErrorType.PERMISSION_DENIED,
      message: 'Permission denied',
      details: { originalError: error.message },
      timestamp,
    };
  }
  
  return {
    type: APIErrorType.SERVER_ERROR,
    message: error.message || 'Unknown server error',
    details: { originalError: error },
    timestamp,
  };
};
```

## Rate Limiting

### Client-Side Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(endpoint: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(endpoint)) {
      this.requests.set(endpoint, []);
    }
    
    const endpointRequests = this.requests.get(endpoint)!;
    
    // Remove old requests outside the window
    const validRequests = endpointRequests.filter(time => time > windowStart);
    this.requests.set(endpoint, validRequests);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
```

## Caching Strategy

### Cache Implementation

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class APICache {
  private static instance: APICache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  static getInstance(): APICache {
    if (!APICache.instance) {
      APICache.instance = new APICache();
    }
    return APICache.instance;
  }
  
  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    
    if (!cached) {
      // Try to get from persistent storage
      try {
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < parsed.ttl) {
            this.cache.set(key, parsed);
            return parsed.data;
          }
        }
      } catch (error) {
        console.error('Cache retrieval error:', error);
      }
      return null;
    }
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return cached.data;
  }
  
  async set<T>(key: string, data: T, ttlMs: number = 300000): Promise<void> {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    
    this.cache.set(key, cacheEntry);
    
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }
  
  clear(): void {
    this.cache.clear();
    // Clear persistent cache
    AsyncStorage.getAllKeys().then(keys => {
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      AsyncStorage.multiRemove(cacheKeys);
    });
  }
}

export const apiCache = APICache.getInstance();
```

## Testing

### API Testing Utilities

```typescript
// __tests__/api.test.ts
import { getNearbyObjects, startARSession } from '../api/objects';

describe('API Functions', () => {
  test('getNearbyObjects returns valid data', async () => {
    const objects = await getNearbyObjects(37.7749, -122.4194, 100);
    
    expect(Array.isArray(objects)).toBe(true);
    if (objects.length > 0) {
      expect(objects[0]).toHaveProperty('id');
      expect(objects[0]).toHaveProperty('latitude');
      expect(objects[0]).toHaveProperty('longitude');
      expect(objects[0]).toHaveProperty('model_url');
    }
  });
  
  test('startARSession creates session', async () => {
    const sessionData = {
      device_info: {
        platform: 'ios',
        os_version: '17.0',
        app_version: '1.0.0',
        device_model: 'iPhone 15 Pro',
        screen_resolution: '1179x2556',
        ar_capabilities: ['world_tracking'],
      },
      start_location: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 10.0,
      },
    };
    
    const session = await startARSession(sessionData);
    
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('started_at');
  });
});
```

---

*This API documentation will be updated as new endpoints are added and existing ones are modified.*