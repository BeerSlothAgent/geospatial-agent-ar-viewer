-- Migration: Add 3D model and rendering columns to deployed_objects table
-- This migration adds the missing columns needed for AR object rendering

-- Add missing 3D model and rendering columns with proper defaults
ALTER TABLE deployed_objects 
ADD COLUMN IF NOT EXISTS model_url TEXT,
ADD COLUMN IF NOT EXISTS model_type TEXT DEFAULT 'sphere',
ADD COLUMN IF NOT EXISTS scale_x DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS scale_y DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS scale_z DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS rotation_x DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rotation_y DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rotation_z DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS visibility_radius DOUBLE PRECISION DEFAULT 50.0;

-- Update existing records to ensure they have default values
UPDATE deployed_objects 
SET 
  model_type = COALESCE(model_type, 'sphere'),
  scale_x = COALESCE(scale_x, 1.0),
  scale_y = COALESCE(scale_y, 1.0),
  scale_z = COALESCE(scale_z, 1.0),
  rotation_x = COALESCE(rotation_x, 0.0),
  rotation_y = COALESCE(rotation_y, 0.0),
  rotation_z = COALESCE(rotation_z, 0.0),
  visibility_radius = COALESCE(visibility_radius, 50.0)
WHERE 
  model_type IS NULL 
  OR scale_x IS NULL 
  OR scale_y IS NULL 
  OR scale_z IS NULL 
  OR rotation_x IS NULL 
  OR rotation_y IS NULL 
  OR rotation_z IS NULL 
  OR visibility_radius IS NULL;

-- Add performance index for visibility radius queries
CREATE INDEX IF NOT EXISTS idx_deployed_objects_visibility ON deployed_objects (visibility_radius);

-- Add performance index for active objects with coordinates
CREATE INDEX IF NOT EXISTS idx_deployed_objects_active_coords ON deployed_objects (is_active, latitude, longitude) WHERE is_active = true;

-- Insert sample data for testing (only if table is empty)
INSERT INTO deployed_objects (
  user_id, 
  object_type, 
  name, 
  description, 
  latitude, 
  longitude, 
  altitude,
  model_type,
  scale_x, 
  scale_y, 
  scale_z,
  visibility_radius,
  is_active
) 
SELECT 
  'demo-user',
  'test-cube',
  'Demo AR Cube',
  'A demonstration AR cube for testing the AR viewer',
  37.7749,
  -122.4194,
  10.0,
  'cube',
  1.0,
  1.0,
  1.0,
  50.0,
  true
WHERE NOT EXISTS (SELECT 1 FROM deployed_objects LIMIT 1)

UNION ALL

SELECT 
  'demo-user',
  'test-sphere',
  'Info Sphere',
  'Information sphere with AR content',
  37.7750,
  -122.4195,
  15.0,
  'sphere',
  0.5,
  0.5,
  0.5,
  75.0,
  true
WHERE NOT EXISTS (SELECT 1 FROM deployed_objects LIMIT 1)

UNION ALL

SELECT 
  'demo-user',
  'test-cylinder',
  'Test Cylinder',
  'Test AR cylinder object for demonstration',
  37.7751,
  -122.4193,
  5.0,
  'cylinder',
  2.0,
  2.0,
  2.0,
  100.0,
  true
WHERE NOT EXISTS (SELECT 1 FROM deployed_objects LIMIT 1);