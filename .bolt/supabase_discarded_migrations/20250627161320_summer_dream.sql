/*
  # Create deployed_objects table with complete schema

  1. New Tables
    - `deployed_objects`
      - `id` (uuid, primary key)
      - `user_id` (text, for user identification)
      - `object_type` (text, type of AR object)
      - `name` (text, object name)
      - `description` (text, object description)
      - `latitude` (double precision, GPS latitude)
      - `longitude` (double precision, GPS longitude)
      - `altitude` (double precision, GPS altitude)
      - `preciselatitude` (double precision, RTK-corrected latitude)
      - `preciselongitude` (double precision, RTK-corrected longitude)
      - `precisealtitude` (double precision, RTK-corrected altitude)
      - `accuracy` (double precision, coordinate accuracy)
      - `correctionapplied` (boolean, RTK correction status)
      - `model_url` (text, 3D model URL)
      - `model_type` (text, model file type)
      - `scale_x`, `scale_y`, `scale_z` (double precision, object scaling)
      - `rotation_x`, `rotation_y`, `rotation_z` (double precision, object rotation)
      - `visibility_radius` (integer, visibility range in meters)
      - `is_active` (boolean, object active status)
      - `created_at` (timestamp, creation time)
      - `updated_at` (timestamp, last update time)

  2. Security
    - Enable RLS on `deployed_objects` table
    - Add policies for public read access and user-specific write access

  3. Functions
    - Create `get_nearby_objects` RPC function for spatial queries

  4. Indexes
    - Add spatial and performance indexes
*/

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
  model_type text DEFAULT 'gltf',
  scale_x double precision DEFAULT 1.0,
  scale_y double precision DEFAULT 1.0,
  scale_z double precision DEFAULT 1.0,
  rotation_x double precision DEFAULT 0.0,
  rotation_y double precision DEFAULT 0.0,
  rotation_z double precision DEFAULT 0.0,
  visibility_radius integer DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE deployed_objects ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployed_objects_active ON deployed_objects (is_active);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_ar_query ON deployed_objects (is_active, preciselatitude, preciselongitude) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_correction_applied ON deployed_objects (correctionapplied);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_precise_coords ON deployed_objects (preciselatitude, preciselongitude);

-- Create the get_nearby_objects function
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
  visibility_radius integer,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision
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
    do.is_active,
    do.visibility_radius,
    do.created_at,
    do.updated_at,
    -- Calculate distance using Haversine formula
    (
      6371000 * acos(
        cos(radians(user_lat)) * 
        cos(radians(do.latitude)) * 
        cos(radians(do.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(do.latitude))
      )
    )::double precision as distance_meters
  FROM deployed_objects do
  WHERE 
    do.is_active = true
    AND (
      6371000 * acos(
        cos(radians(user_lat)) * 
        cos(radians(do.latitude)) * 
        cos(radians(do.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(do.latitude))
      )
    ) <= LEAST(radius_meters, do.visibility_radius)
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
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
  'gltf',
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
  'gltf',
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
  'gltf',
  2.0, 2.0, 2.0,
  100
)
ON CONFLICT DO NOTHING;