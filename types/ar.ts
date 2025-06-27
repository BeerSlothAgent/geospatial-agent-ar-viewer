// AR-specific type definitions

export interface ARObject {
  id: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  modelUrl: string;
  modelType: 'gltf' | 'obj' | 'fbx' | 'dae';
  visible: boolean;
  distance: number;
  metadata: {
    name: string;
    description?: string;
    created_at: string;
  };
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ARScene {
  objects: ARObject[];
  camera: {
    position: Vector3;
    rotation: Vector3;
    fov: number;
  };
  lighting: {
    ambient: number;
    directional: {
      intensity: number;
      position: Vector3;
    };
  };
}

export interface ARSessionState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  objectsLoaded: number;
  renderStats: {
    fps: number;
    triangles: number;
    drawCalls: number;
  };
}

export interface CoordinateConversion {
  gpsToWorld: (lat: number, lng: number, alt?: number) => Vector3;
  worldToGPS: (position: Vector3) => { lat: number; lng: number; alt: number };
}

export interface ARCapabilities {
  webXRSupported: boolean;
  webGLSupported: boolean;
  deviceOrientationSupported: boolean;
  cameraSupported: boolean;
  performanceLevel: 'high' | 'medium' | 'low';
}