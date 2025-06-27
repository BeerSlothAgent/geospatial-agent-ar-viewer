/*
  # Complete Database Schema Setup

  1. New Tables
    - `deployed_objects` - Store AR objects with geospatial coordinates
    - Complete with all 3D rendering properties and metadata

  2. Security
    - Enable RLS on deployed_objects table
    - Add policies for public read access and user-specific write access

  3. Functions
    - `get_nearby_objects` - Query objects by proximity with distance calculation

  4. Sample Data
    - Insert demo objects for testing if table is empty
*/

-- Drop any existing functions first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_nearby_objects(double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_nearby_objects(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS get_nearby_objects(REAL, REAL, REAL);
DROP FUNCTION IF EXISTS get_nearby_objects(numeric, numeric, numeric);
DROP FUNCTION IF EXISTS get_nearby_objects(float, float, float);

-- Create the deployed_objects table with all required columns
CREATE TABLE IF NOT EXISTS deployed_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  object_type text NOT NULL,
  name text,
  description text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  altitude double precision,
  preciselatitude double precision,
  preciselongitude double precision,
  precisealtitude double precision,
  accuracy double precision,
  correctionapplied boolean DEFAULT false,
  model_url text,
  model_type text DEFAULT 'sphere',
  scale_x double precision DEFAULT 1.0,
  scale_y double precision DEFAULT 1.0,
  scale_z double precision DEFAULT 1.0,
  rotation_x double precision DEFAULT 0.0,
  rotation_y double precision DEFAULT 0.0,
  rotation_z double precision DEFAULT 0.0,
  visibility_radius double precision DEFAULT 100.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE deployed_objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Anyone can read deployed objects" ON deployed_objects;
  DROP POLICY IF EXISTS "Users can insert their own objects" ON deployed_objects;
  DROP POLICY IF EXISTS "Users can update their own objects" ON deployed_objects;
  DROP POLICY IF EXISTS "Users can delete their own objects" ON deployed_objects;
  
  -- Create policies for public read access
  CREATE POLICY "Anyone can read deployed objects"
    ON deployed_objects
    FOR SELECT
    TO public
    USING (true);

  -- Create policies for authenticated users to manage their own objects
  CREATE POLICY "Users can insert their own objects"
    ON deployed_objects
    FOR INSERT
    TO public
    WITH CHECK (true);

  CREATE POLICY "Users can update their own objects"
    ON deployed_objects
    FOR UPDATE
    TO public
    USING (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))
    WITH CHECK (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text));

  CREATE POLICY "Users can delete their own objects"
    ON deployed_objects
    FOR DELETE
    TO public
    USING (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text));
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployed_objects_active ON deployed_objects (is_active);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_ar_query ON deployed_objects (is_active, preciselatitude, preciselongitude) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_correction_applied ON deployed_objects (correctionapplied);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_precise_coords ON deployed_objects (preciselatitude, preciselongitude);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_visibility ON deployed_objects (visibility_radius);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_active_coords ON deployed_objects (is_active, latitude, longitude) WHERE (is_active = true);

-- Create the get_nearby_objects function with proper signature
CREATE OR REPLACE FUNCTION get_nearby_objects(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  altitude double precision,
  model_url text,
  model_type text,
  scale_x double precision,
  scale_y double precision,
  scale_z double precision,
  rotation_x double precision,
  rotation_y double precision,
  rotation_z double precision,
  is_active boolean,
  visibility_radius double precision,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    deployed_objects.id,
    deployed_objects.name,
    deployed_objects.description,
    deployed_objects.latitude,
    deployed_objects.longitude,
    deployed_objects.altitude,
    deployed_objects.model_url,
    deployed_objects.model_type,
    deployed_objects.scale_x,
    deployed_objects.scale_y,
    deployed_objects.scale_z,
    deployed_objects.rotation_x,
    deployed_objects.rotation_y,
    deployed_objects.rotation_z,
    deployed_objects.is_active,
    deployed_objects.visibility_radius,
    deployed_objects.created_at,
    deployed_objects.updated_at,
    -- Calculate distance using Haversine formula
    (
      6371000 * acos(
        cos(radians(user_lat)) * 
        cos(radians(deployed_objects.latitude)) * 
        cos(radians(deployed_objects.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(deployed_objects.latitude))
      )
    )::double precision as distance_meters
  FROM deployed_objects
  WHERE 
    deployed_objects.is_active = true
    AND (
      6371000 * acos(
        cos(radians(user_lat)) * 
        cos(radians(deployed_objects.latitude)) * 
        cos(radians(deployed_objects.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(deployed_objects.latitude))
      )
    ) <= LEAST(radius_meters, deployed_objects.visibility_radius)
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Add constraints for valid values using DO blocks
DO $$ 
BEGIN
  -- Add scale_x constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_scale_x' 
    AND table_name = 'deployed_objects'
  ) THEN
    ALTER TABLE deployed_objects ADD CONSTRAINT valid_scale_x CHECK (scale_x > 0);
  END IF;

  -- Add scale_y constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_scale_y' 
    AND table_name = 'deployed_objects'
  ) THEN
    ALTER TABLE deployed_objects ADD CONSTRAINT valid_scale_y CHECK (scale_y > 0);
  END IF;

  -- Add scale_z constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_scale_z' 
    AND table_name = 'deployed_objects'
  ) THEN
    ALTER TABLE deployed_objects ADD CONSTRAINT valid_scale_z CHECK (scale_z > 0);
  END IF;

  -- Add visibility_radius constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_visibility_radius' 
    AND table_name = 'deployed_objects'
  ) THEN
    ALTER TABLE deployed_objects ADD CONSTRAINT valid_visibility_radius CHECK (visibility_radius > 0 AND visibility_radius <= 10000);
  END IF;
END $$;

-- Insert sample data only if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM deployed_objects LIMIT 1) THEN
    INSERT INTO deployed_objects (
      user_id, object_type, name, description, latitude, longitude, altitude,
      model_url, model_type, scale_x, scale_y, scale_z, visibility_radius
    ) VALUES 
    (
      'demo-user',
      'test-object',
      'Demo AR Cube',
      'A demonstration AR cube for testing the AR viewer',
      37.7749,
      -122.4194,
      10.0,
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
      'cube',
      1.0, 1.0, 1.0,
      50
    ),
    (
      'demo-user',
      'info-sphere',
      'Info Sphere',
      'Information sphere with AR content',
      37.7750,
      -122.4195,
      15.0,
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sphere/glTF/Sphere.gltf',
      'sphere',
      0.5, 0.5, 0.5,
      75
    ),
    (
      'demo-user',
      'test-object',
      'Test Duck',
      'Test AR duck object for demonstration',
      37.7751,
      -122.4193,
      5.0,
      'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf',
      'duck',
      2.0, 2.0, 2.0,
      100
    );
  END IF;
END $$;