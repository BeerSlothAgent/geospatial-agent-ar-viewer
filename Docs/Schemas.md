# Database Schemas Documentation

## Overview

This document defines all database schemas, data models, and relationships for the Standalone Geospatial AR Viewer application. The primary database is Supabase (PostgreSQL) with PostGIS extension for geospatial operations.

## Database Configuration

### Supabase Setup
- **Database:** PostgreSQL with PostGIS extension
- **Authentication:** Supabase Auth (optional for this standalone app)
- **Storage:** Supabase Storage for 3D models and assets
- **Real-time:** Supabase Realtime for live updates

### Extensions Required
```sql
-- Enable PostGIS for geospatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Core Tables

### 1. deployed_objects

Primary table for storing 3D objects with geospatial coordinates.

```sql
CREATE TABLE deployed_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(8, 3) DEFAULT 0,
    model_url TEXT NOT NULL,
    model_type VARCHAR(50) DEFAULT 'gltf',
    scale_x DECIMAL(5, 3) DEFAULT 1.0,
    scale_y DECIMAL(5, 3) DEFAULT 1.0,
    scale_z DECIMAL(5, 3) DEFAULT 1.0,
    rotation_x DECIMAL(5, 3) DEFAULT 0.0,
    rotation_y DECIMAL(5, 3) DEFAULT 0.0,
    rotation_z DECIMAL(5, 3) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    visibility_radius INTEGER DEFAULT 100, -- meters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Geospatial point for efficient queries
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_Point(longitude, latitude)
    ) STORED
);

-- Indexes for performance
CREATE INDEX idx_deployed_objects_location ON deployed_objects USING GIST (location);
CREATE INDEX idx_deployed_objects_active ON deployed_objects (is_active);
CREATE INDEX idx_deployed_objects_created_at ON deployed_objects (created_at);
```

### 2. ar_sessions (Optional)

Track AR session data for analytics and debugging.

```sql
CREATE TABLE ar_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    device_info JSONB,
    start_location GEOGRAPHY(POINT, 4326),
    end_location GEOGRAPHY(POINT, 4326),
    session_duration INTEGER, -- seconds
    objects_viewed INTEGER DEFAULT 0,
    objects_interacted INTEGER DEFAULT 0,
    performance_metrics JSONB,
    error_logs JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_session_duration CHECK (session_duration >= 0)
);

-- Indexes
CREATE INDEX idx_ar_sessions_user_id ON ar_sessions (user_id);
CREATE INDEX idx_ar_sessions_started_at ON ar_sessions (started_at);
```

### 3. object_interactions

Log user interactions with AR objects.

```sql
CREATE TABLE object_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES ar_sessions(id),
    object_id UUID REFERENCES deployed_objects(id),
    interaction_type VARCHAR(50) NOT NULL, -- 'view', 'tap', 'long_press', etc.
    interaction_data JSONB,
    user_location GEOGRAPHY(POINT, 4326),
    distance_to_object DECIMAL(8, 3), -- meters
    interaction_duration INTEGER, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_object_interactions_session_id ON object_interactions (session_id);
CREATE INDEX idx_object_interactions_object_id ON object_interactions (object_id);
CREATE INDEX idx_object_interactions_type ON object_interactions (interaction_type);
```

### 4. object_categories (Future Enhancement)

Categorize AR objects for better organization.

```sql
CREATE TABLE object_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    color_hex VARCHAR(7), -- #RRGGBB format
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category reference to deployed_objects
ALTER TABLE deployed_objects 
ADD COLUMN category_id UUID REFERENCES object_categories(id);
```

## TypeScript Interfaces

### Core Data Models

```typescript
// deployed_objects table
export interface DeployedObject {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  model_url: string;
  model_type: 'gltf' | 'obj' | 'fbx' | 'dae';
  scale_x: number;
  scale_y: number;
  scale_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  is_active: boolean;
  visibility_radius: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  category_id?: string;
}

// ar_sessions table
export interface ARSession {
  id: string;
  user_id?: string;
  device_info?: DeviceInfo;
  start_location?: GeographicPoint;
  end_location?: GeographicPoint;
  session_duration?: number;
  objects_viewed: number;
  objects_interacted: number;
  performance_metrics?: PerformanceMetrics;
  error_logs?: ErrorLog[];
  started_at: string;
  ended_at?: string;
}

// object_interactions table
export interface ObjectInteraction {
  id: string;
  session_id: string;
  object_id: string;
  interaction_type: InteractionType;
  interaction_data?: Record<string, any>;
  user_location?: GeographicPoint;
  distance_to_object?: number;
  interaction_duration?: number;
  created_at: string;
}

// Supporting interfaces
export interface GeographicPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface DeviceInfo {
  platform: string;
  os_version: string;
  app_version: string;
  device_model: string;
  screen_resolution: string;
  ar_capabilities: string[];
}

export interface PerformanceMetrics {
  avg_fps: number;
  memory_usage: number;
  battery_usage: number;
  network_requests: number;
  render_time_ms: number;
}

export interface ErrorLog {
  timestamp: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  context?: Record<string, any>;
}

export type InteractionType = 
  | 'view'
  | 'tap'
  | 'long_press'
  | 'pinch'
  | 'rotate'
  | 'move'
  | 'dismiss';
```

## Database Functions

### 1. Get Nearby Objects

```sql
CREATE OR REPLACE FUNCTION get_nearby_objects(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_meters INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    altitude DECIMAL,
    model_url TEXT,
    model_type VARCHAR,
    scale_x DECIMAL,
    scale_y DECIMAL,
    scale_z DECIMAL,
    rotation_x DECIMAL,
    rotation_y DECIMAL,
    rotation_z DECIMAL,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        do.id,
        do.name,
        do.description,
        do.latitude,
        do.longitude,
        do.altitude,
        do.model_url,
        do.model_type,
        do.scale_x,
        do.scale_y,
        do.scale_z,
        do.rotation_x,
        do.rotation_y,
        do.rotation_z,
        ST_Distance(
            do.location,
            ST_Point(user_lng, user_lat)::geography
        )::DECIMAL as distance_meters
    FROM deployed_objects do
    WHERE 
        do.is_active = true
        AND ST_DWithin(
            do.location,
            ST_Point(user_lng, user_lat)::geography,
            LEAST(radius_meters, do.visibility_radius)
        )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;
```

### 2. Update Object Location

```sql
CREATE OR REPLACE FUNCTION update_object_location(
    object_id UUID,
    new_lat DECIMAL,
    new_lng DECIMAL,
    new_alt DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE deployed_objects 
    SET 
        latitude = new_lat,
        longitude = new_lng,
        altitude = COALESCE(new_alt, altitude),
        updated_at = NOW()
    WHERE id = object_id AND is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS)

### Enable RLS on Tables

```sql
-- Enable RLS on all tables
ALTER TABLE deployed_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE object_categories ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

```sql
-- deployed_objects policies
CREATE POLICY "Public objects are viewable by everyone" 
ON deployed_objects FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can insert their own objects" 
ON deployed_objects FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own objects" 
ON deployed_objects FOR UPDATE 
USING (auth.uid() = created_by);

-- ar_sessions policies
CREATE POLICY "Users can view their own sessions" 
ON ar_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON ar_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- object_interactions policies
CREATE POLICY "Users can view interactions from their sessions" 
ON object_interactions FOR SELECT 
USING (
    session_id IN (
        SELECT id FROM ar_sessions WHERE user_id = auth.uid()
    )
);
```

## Triggers

### Update Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to deployed_objects
CREATE TRIGGER update_deployed_objects_updated_at
    BEFORE UPDATE ON deployed_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Data Validation

### Constraints

```sql
-- Latitude/Longitude validation
ALTER TABLE deployed_objects 
ADD CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE deployed_objects 
ADD CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180);

-- Scale validation (prevent negative or zero scales)
ALTER TABLE deployed_objects 
ADD CONSTRAINT valid_scale_x CHECK (scale_x > 0);

ALTER TABLE deployed_objects 
ADD CONSTRAINT valid_scale_y CHECK (scale_y > 0);

ALTER TABLE deployed_objects 
ADD CONSTRAINT valid_scale_z CHECK (scale_z > 0);

-- Visibility radius validation
ALTER TABLE deployed_objects 
ADD CONSTRAINT valid_visibility_radius CHECK (visibility_radius > 0 AND visibility_radius <= 10000);
```

## Sample Data

### Insert Sample Objects

```sql
-- Sample AR objects for testing
INSERT INTO deployed_objects (
    name, description, latitude, longitude, altitude, 
    model_url, model_type, visibility_radius
) VALUES 
(
    'Test Cube',
    'A simple test cube for AR testing',
    37.7749,
    -122.4194,
    10.0,
    'https://example.com/models/cube.gltf',
    'gltf',
    50
),
(
    'Welcome Sphere',
    'Welcome message sphere',
    37.7750,
    -122.4195,
    15.0,
    'https://example.com/models/sphere.gltf',
    'gltf',
    75
);
```

## Migration Scripts

### Initial Migration

```sql
-- 001_initial_schema.sql
-- Create all tables, indexes, and functions
-- (Include all the CREATE statements above)
```

### Future Migrations

```sql
-- 002_add_categories.sql
-- Add object categories functionality

-- 003_add_analytics.sql
-- Add advanced analytics tables

-- 004_add_user_preferences.sql
-- Add user preference storage
```

---

*This schema documentation will be updated as the database structure evolves and new features are added.*