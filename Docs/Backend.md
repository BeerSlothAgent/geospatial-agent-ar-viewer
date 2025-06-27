# Backend Operations Documentation

## Overview

This document outlines all backend operations, integrations, and server-side functionality for the Standalone Geospatial AR Viewer application. The backend primarily consists of external service integrations rather than custom server implementation.

## Architecture

### Backend Strategy
- **Serverless Architecture:** Utilizing external APIs and services
- **Database:** Supabase for data storage and real-time capabilities
- **Location Services:** Integration with precise location APIs
- **File Storage:** Supabase Storage for 3D models and assets

## External Service Integrations

### 1. Supabase Integration

#### Configuration
```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Database Operations
- **deployed_objects table:** Store and retrieve 3D objects with geospatial coordinates
- **user_sessions:** Track AR session data (optional)
- **object_interactions:** Log user interactions with AR objects

#### Real-time Subscriptions
```typescript
// Real-time object updates
const subscription = supabase
  .channel('deployed_objects')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'deployed_objects' },
    (payload) => {
      // Handle real-time updates
    }
  )
  .subscribe()
```

### 2. Location Services

#### Precise Location API
- **Endpoint:** `/api/get-precise-location` (from main AgentSphere project)
- **Purpose:** Obtain high-accuracy GPS coordinates
- **Integration:** HTTP requests from mobile app

```typescript
// Location service integration
const getPreciseLocation = async () => {
  try {
    const response = await fetch('/api/get-precise-location', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Location service error:', error);
    throw error;
  }
};
```

#### Expo Location Services
```typescript
import * as Location from 'expo-location';

const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  
  return await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
};
```

## Data Management

### 1. Object Retrieval Logic

#### Proximity-Based Queries
```sql
-- Supabase query for nearby objects
SELECT *
FROM deployed_objects
WHERE ST_DWithin(
  ST_Point(longitude, latitude)::geography,
  ST_Point($1, $2)::geography,
  $3  -- radius in meters
)
ORDER BY ST_Distance(
  ST_Point(longitude, latitude)::geography,
  ST_Point($1, $2)::geography
);
```

#### TypeScript Implementation
```typescript
const getNearbyObjects = async (userLat: number, userLng: number, radius: number = 100) => {
  const { data, error } = await supabase
    .rpc('get_nearby_objects', {
      user_lat: userLat,
      user_lng: userLng,
      radius_meters: radius
    });
    
  if (error) throw error;
  return data;
};
```

### 2. Caching Strategy

#### Local Storage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const cacheObjects = async (objects: DeployedObject[]) => {
  try {
    await AsyncStorage.setItem('cached_objects', JSON.stringify(objects));
  } catch (error) {
    console.error('Cache error:', error);
  }
};

const getCachedObjects = async (): Promise<DeployedObject[]> => {
  try {
    const cached = await AsyncStorage.getItem('cached_objects');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return [];
  }
};
```

## API Endpoints (Future Implementation)

### 1. Object Management
- `GET /api/objects/nearby` - Retrieve nearby objects
- `POST /api/objects/interaction` - Log object interactions
- `GET /api/objects/:id` - Get specific object details

### 2. Session Management
- `POST /api/sessions/start` - Start AR session
- `PUT /api/sessions/:id/update` - Update session data
- `POST /api/sessions/:id/end` - End AR session

### 3. Analytics
- `POST /api/analytics/event` - Track user events
- `GET /api/analytics/performance` - Performance metrics

## Error Handling

### Network Error Handling
```typescript
const handleNetworkError = (error: Error) => {
  if (error.message.includes('Network')) {
    // Handle offline scenario
    return getCachedObjects();
  }
  throw error;
};
```

### Retry Logic
```typescript
const retryOperation = async (operation: () => Promise<any>, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};
```

## Security Considerations

### 1. API Key Management
- Store sensitive keys in environment variables
- Use Expo SecureStore for sensitive data
- Implement key rotation strategy

### 2. Data Validation
```typescript
import { z } from 'zod';

const DeployedObjectSchema = z.object({
  id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  model_url: z.string().url(),
  created_at: z.string().datetime(),
});

const validateObject = (data: unknown) => {
  return DeployedObjectSchema.parse(data);
};
```

### 3. Rate Limiting
- Implement client-side rate limiting
- Cache frequently accessed data
- Use exponential backoff for retries

## Performance Optimization

### 1. Data Fetching
- Implement pagination for large datasets
- Use background sync for non-critical updates
- Optimize query performance with proper indexing

### 2. Caching Strategy
- Cache static 3D models locally
- Implement cache invalidation logic
- Use compression for cached data

### 3. Background Processing
```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // Update cached objects in background
  try {
    await updateCachedObjects();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

## Monitoring and Logging

### 1. Error Tracking
```typescript
const logError = (error: Error, context: string) => {
  console.error(`[${context}] ${error.message}`, error.stack);
  // Send to error tracking service
};
```

### 2. Performance Metrics
```typescript
const trackPerformance = (operation: string, duration: number) => {
  console.log(`Performance: ${operation} took ${duration}ms`);
  // Send to analytics service
};
```

## Future Enhancements

### 1. Real-time Collaboration
- WebSocket connections for multi-user experiences
- Real-time object synchronization
- Collaborative AR sessions

### 2. Advanced Analytics
- User behavior tracking
- Performance monitoring
- Usage analytics dashboard

### 3. Content Delivery Network (CDN)
- 3D model caching and delivery
- Global content distribution
- Optimized asset loading

---

*This document will be updated as backend functionality is implemented and refined.*