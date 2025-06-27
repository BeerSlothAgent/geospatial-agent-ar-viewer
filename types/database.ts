// Database type definitions for Supabase integration

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
  // Calculated fields
  distance_meters?: number;
}

export interface ObjectCategory {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color_hex?: string;
  is_active: boolean;
  created_at: string;
}

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

// Database query options
export interface NearbyObjectsQuery {
  latitude: number;
  longitude: number;
  radius_meters?: number;
  limit?: number;
  category_id?: string;
  include_inactive?: boolean;
}

export interface ObjectsResponse {
  data: DeployedObject[];
  count: number;
  error?: string;
}

// Database error types
export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}