import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { AREngine } from '@/lib/ar-engine';
import { ARSessionState, ARCapabilities } from '@/types/ar';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

export interface UseAROptions {
  enableDeviceOrientation?: boolean;
  maxObjects?: number;
  renderDistance?: number;
}

const DEFAULT_OPTIONS: UseAROptions = {
  enableDeviceOrientation: true,
  maxObjects: 50,
  renderDistance: 100,
};

export function useAR(options: UseAROptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [sessionState, setSessionState] = useState<ARSessionState>({
    isActive: false,
    isLoading: false,
    error: null,
    objectsLoaded: 0,
    renderStats: {
      fps: 0,
      triangles: 0,
      drawCalls: 0,
    },
  });

  const [capabilities, setCapabilities] = useState<ARCapabilities>({
    webXRSupported: false,
    webGLSupported: false,
    deviceOrientationSupported: false,
    cameraSupported: false,
    performanceLevel: 'medium',
  });

  const arEngine = useRef<AREngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMounted = useRef(true);
  const loadedObjects = useRef<Set<string>>(new Set());

  // Check AR capabilities
  const checkCapabilities = useCallback(async (): Promise<ARCapabilities> => {
    const caps: ARCapabilities = {
      webXRSupported: false,
      webGLSupported: false,
      deviceOrientationSupported: false,
      cameraSupported: false,
      performanceLevel: 'medium',
    };

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      caps.webGLSupported = !!gl;
    } catch (e) {
      caps.webGLSupported = false;
    }

    // Check WebXR support (if available)
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      try {
        caps.webXRSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
      } catch (e) {
        caps.webXRSupported = false;
      }
    }

    // Check device orientation support
    caps.deviceOrientationSupported = Platform.OS !== 'web' || 
      (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window);

    // Check camera support
    caps.cameraSupported = Platform.OS !== 'web' || 
      (typeof navigator !== 'undefined' && 'mediaDevices' in navigator);

    // Determine performance level based on device
    if (Platform.OS === 'web') {
      // Simple performance detection for web
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer.includes('Intel') || renderer.includes('AMD')) {
            caps.performanceLevel = 'medium';
          } else if (renderer.includes('NVIDIA') || renderer.includes('Apple')) {
            caps.performanceLevel = 'high';
          } else {
            caps.performanceLevel = 'low';
          }
        }
      }
    } else {
      // Mobile devices - assume medium performance
      caps.performanceLevel = 'medium';
    }

    return caps;
  }, []);

  // Initialize AR session
  const initializeSession = useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    try {
      if (isMounted.current) {
        setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      // Check capabilities first
      const caps = await checkCapabilities();
      setCapabilities(caps);

      if (!caps.webGLSupported) {
        throw new Error('WebGL is not supported on this device');
      }

      // Initialize AR engine
      arEngine.current = new AREngine(canvas);
      canvasRef.current = canvas;

      // Setup device orientation if supported
      if (caps.deviceOrientationSupported && opts.enableDeviceOrientation) {
        setupDeviceOrientation();
      }

      if (isMounted.current) {
        setSessionState(prev => ({
          ...prev,
          isActive: true,
          isLoading: false,
          error: null,
        }));
      }

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize AR session';
      
      if (isMounted.current) {
        setSessionState(prev => ({
          ...prev,
          isActive: false,
          isLoading: false,
          error: errorMessage,
        }));
      }

      return false;
    }
  }, [opts.enableDeviceOrientation]);

  // Setup device orientation tracking
  const setupDeviceOrientation = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (arEngine.current && event.alpha !== null && event.beta !== null && event.gamma !== null) {
          arEngine.current.updateCameraOrientation(event.alpha, event.beta, event.gamma);
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  // Load AR objects
  const loadObjects = useCallback(async (objects: DeployedObject[], userLocation: LocationData) => {
    if (!arEngine.current || !isMounted.current) return;

    try {
      // Set user location for coordinate conversion
      arEngine.current.setUserLocation(userLocation);

      // Filter objects by distance
      const nearbyObjects = objects.filter(obj => {
        const distance = obj.distance_meters || 0;
        return distance <= opts.renderDistance!;
      });

      // Limit number of objects for performance
      const objectsToLoad = nearbyObjects.slice(0, opts.maxObjects);

      // Load new objects
      for (const object of objectsToLoad) {
        if (!loadedObjects.current.has(object.id)) {
          await arEngine.current.loadObject(object);
          loadedObjects.current.add(object.id);
        }
      }

      // Remove objects that are no longer nearby
      const currentObjectIds = new Set(objectsToLoad.map(obj => obj.id));
      for (const loadedId of loadedObjects.current) {
        if (!currentObjectIds.has(loadedId)) {
          arEngine.current.removeObject(loadedId);
          loadedObjects.current.delete(loadedId);
        }
      }

      if (isMounted.current) {
        setSessionState(prev => ({
          ...prev,
          objectsLoaded: loadedObjects.current.size,
          renderStats: arEngine.current?.getRenderStats() || prev.renderStats,
        }));
      }
    } catch (error: any) {
      console.error('Failed to load AR objects:', error);
      
      if (isMounted.current) {
        setSessionState(prev => ({
          ...prev,
          error: error.message || 'Failed to load AR objects',
        }));
      }
    }
  }, [opts.renderDistance, opts.maxObjects]);

  // Get objects currently in camera view
  const getObjectsInView = useCallback((): string[] => {
    if (!arEngine.current) return [];
    return arEngine.current.getObjectsInView();
  }, []);

  // End AR session
  const endSession = useCallback(() => {
    if (arEngine.current) {
      arEngine.current.dispose();
      arEngine.current = null;
    }
    
    canvasRef.current = null;
    loadedObjects.current.clear();

    if (isMounted.current) {
      setSessionState({
        isActive: false,
        isLoading: false,
        error: null,
        objectsLoaded: 0,
        renderStats: {
          fps: 0,
          triangles: 0,
          drawCalls: 0,
        },
      });
    }
  }, []);

  // Handle canvas resize
  const handleResize = useCallback((width: number, height: number) => {
    if (arEngine.current) {
      arEngine.current.resize(width, height);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      endSession();
    };
  }, [endSession]);

  return {
    sessionState,
    capabilities,
    initializeSession,
    loadObjects,
    getObjectsInView,
    endSession,
    handleResize,
  };
}