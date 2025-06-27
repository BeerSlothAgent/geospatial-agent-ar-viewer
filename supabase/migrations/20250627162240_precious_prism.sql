/*
  # Add Missing Columns to deployed_objects Table

  1. New Columns
    - `model_url` (text) - URL to the 3D model file
    - `model_type` (text) - Type of 3D model (gltf, obj, etc.)
    - `scale_x`, `scale_y`, `scale_z` (real) - 3D scaling factors
    - `rotation_x`, `rotation_y`, `rotation_z` (real) - 3D rotation angles
    - `visibility_radius` (real) - Visibility radius in meters

  2. Updates
    - Set default values for all new columns
    - Ensure backward compatibility with existing data

  3. Notes
    - Uses IF NOT EXISTS to prevent errors if columns already exist
    - All new columns are nullable or have defaults
*/

-- Add missing 3D model and rendering columns
ALTER TABLE deployed_objects 
ADD COLUMN IF NOT EXISTS model_url TEXT,
ADD COLUMN IF NOT EXISTS model_type TEXT DEFAULT 'sphere',
ADD COLUMN IF NOT EXISTS scale_x REAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS scale_y REAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS scale_z REAL DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS rotation_x REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rotation_y REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rotation_z REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS visibility_radius REAL DEFAULT 50.0;

-- Update existing records to have default values for new columns
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

-- Add constraints for valid values
ALTER TABLE deployed_objects 
ADD CONSTRAINT IF NOT EXISTS valid_scale_x CHECK (scale_x > 0),
ADD CONSTRAINT IF NOT EXISTS valid_scale_y CHECK (scale_y > 0),
ADD CONSTRAINT IF NOT EXISTS valid_scale_z CHECK (scale_z > 0),
ADD CONSTRAINT IF NOT EXISTS valid_visibility_radius CHECK (visibility_radius > 0 AND visibility_radius <= 10000);

-- Add index for visibility radius queries
CREATE INDEX IF NOT EXISTS idx_deployed_objects_visibility ON deployed_objects (visibility_radius);