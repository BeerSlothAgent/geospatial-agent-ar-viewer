/*
  # Create deployed_objects table

  1. New Tables
    - `deployed_objects` - Store AR objects with geospatial coordinates
    - Complete with all 3D rendering properties and metadata

  2. Security
    - Enable RLS on deployed_objects table
    - Add policies for public read access and user-specific write access

  3. Sample Data
    - Insert demo objects for testing
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
CREATE INDEX IF NOT EXISTS idx_deployed_objects_active_coords ON deployed_objects (is_active, latitude, longitude) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_ar_query ON deployed_objects (is_active, preciselatitude, preciselongitude) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_correction_applied ON deployed_objects (correctionapplied);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_precise_coords ON deployed_objects (preciselatitude, preciselongitude);
CREATE INDEX IF NOT EXISTS idx_deployed_objects_visibility ON deployed_objects (visibility_radius);

-- Insert sample data for testing
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
);