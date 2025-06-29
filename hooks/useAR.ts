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
  const initializationPromise = useRef<Promise<boolean> | null>(null);

  // Debug AR system state
  const debugARSystem = useCallback(() => {
    console.log('=== AR System Debug Info ===');
    console.log('AR Engine:', arEngine.current ? 'Initialized' : 'NULL');
    console.log('Canvas:', canvasRef.current ? 'Available' : 'NULL');
    console.log('Component Mounted:', isMounted.current);
    console.log('Session Active:', sessionState.isActive);
    console.log('Session Loading:', sessionState.isLoading);
    console.log('Objects Loaded:', loadedObjects.current.size);
    console.log('Initialization Promise:', initializationPromise.current ? 'Pending' : 'None');
    console.log('================================');
  }, [sessionState.isActive, sessionState.isLoading]);

  // Check AR capabilities
  const checkCapabilities = useCallback(async (): Promise<ARCapabilities> => {
    const caps: ARCapabilities = {
      webXRSupported: false,
      webGLSupported: false,
      deviceOrientationSupported: false,
      cameraSupported: false,
      performanceLevel: 'medium',
    };

    try {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      caps.webGLSupported = !!gl;
      
      // Clean up test canvas
      canvas.remove();
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
      canvas.remove();
    } else {
      // Mobile devices - assume medium performance
      caps.performanceLevel = 'medium';
    }

    return caps;
  }, []);

  // Wait for AR engine to be ready with timeout
  const waitForAREngine = useCallback(async (timeoutMs: number = 10000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (arEngine.current && isMounted.current) {
        return true;
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }, []);

  // Initialize AR session with comprehensive error handling
  const initializeSession = useCallback(async (canvas: HTMLCanvasElement): Promise<boolean> => {
    // Prevent multiple simultaneous initializations
    if (initializationPromise.current) {
      console.log('AR initialization already in progress, waiting...');
      return await initializationPromise.current;
    }

    initializationPromise.current = (async () => {
      try {
        if (!isMounted.current) {
          throw new Error('Component unmounted during initialization');
        }

        console.log('🚀 Starting AR session initialization...');
        
        if (isMounted.current) {
          setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
        }

        // Check capabilities first
        const caps = await checkCapabilities();
        setCapabilities(caps);

        if (!caps.webGLSupported) {
          throw new Error('WebGL is not supported on this device. Please use a modern browser with WebGL support.');
        }

        // Verify canvas is valid
        if (!canvas || !canvas.getContext) {
          throw new Error('Invalid canvas provided for AR initialization');
        }

        // Clean up any existing AR engine
        if (arEngine.current) {
          console.log('Cleaning up existing AR engine...');
          arEngine.current.dispose();
          arEngine.current = null;
        }

        // Initialize AR engine with error handling
        console.log('Creating new AR engine...');
        arEngine.current = new AREngine(canvas);
        canvasRef.current = canvas;

        // Verify AR engine was created successfully
        if (!arEngine.current) {
          throw new Error('Failed to create AR engine instance');
        }

        // Setup device orientation if supported
        if (caps.deviceOrientationSupported && opts.enableDeviceOrientation) {
          setupDeviceOrientation();
        }

        // Wait a moment for AR engine to fully initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!isMounted.current) {
          throw new Error('Component unmounted during initialization');
        }

        console.log('✅ AR session initialized successfully');

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
        console.error('❌ AR initialization failed:', errorMessage);
        
        // Clean up on error
        if (arEngine.current) {
          try {
            arEngine.current.dispose();
          } catch (e) {
            console.warn('Error during AR engine cleanup:', e);
          }
          arEngine.current = null;
        }

        if (isMounted.current) {
          setSessionState(prev => ({
            ...prev,
            isActive: false,
            isLoading: false,
            error: errorMessage,
          }));
        }

        return false;
      } finally {
        initializationPromise.current = null;
      }
    })();

    return await initializationPromise.current;
  }, [opts.enableDeviceOrientation, checkCapabilities]);

  // Setup device orientation tracking
  const setupDeviceOrientation = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (arEngine.current && event.alpha !== null && event.beta !== null && event.gamma !== null) {
          try {
            arEngine.current.updateCameraOrientation(event.alpha, event.beta, event.gamma);
          } catch (error) {
            console.warn('Error updating camera orientation:', error);
          }
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  // Safe object loading with comprehensive validation and retry logic
  const loadObjects = useCallback(async (objects: DeployedObject[], userLocation: LocationData) => {
    if (!isMounted.current) {
      console.log('Component unmounted, skipping object loading');
      return;
    }

    try {
      console.log(`🔄 Loading ${objects.length} AR objects...`);

      // Verify AR engine exists and is ready
      if (!arEngine.current) {
        console.warn('AR engine not initialized, cannot load objects');
        throw new Error('AR engine not initialized. Please restart the AR session.');
      }

      // Wait for AR engine to be ready with timeout
      const engineReady = await waitForAREngine(5000);
      if (!engineReady) {
        throw new Error('AR engine initialization timeout. Please try again.');
      }

      // Verify user location
      if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
        throw new Error('Invalid user location provided for AR object placement');
      }

      // Set user location for coordinate conversion
      try {
        arEngine.current.setUserLocation(userLocation);
      } catch (error) {
        console.error('Failed to set user location:', error);
        throw new Error('Failed to set user location for AR coordinate conversion');
      }

      // Filter objects by distance
      const nearbyObjects = objects.filter(obj => {
        const distance = obj.distance_meters || 0;
        return distance <= opts.renderDistance!;
      });

      // Limit number of objects for performance
      const objectsToLoad = nearbyObjects.slice(0, opts.maxObjects);
      console.log(`📍 Loading ${objectsToLoad.length} nearby objects (filtered from ${objects.length})`);

      // Load new objects with individual error handling
      let successCount = 0;
      let errorCount = 0;

      for (const object of objectsToLoad) {
        if (!isMounted.current) {
          console.log('Component unmounted during object loading');
          break;
        }

        if (!loadedObjects.current.has(object.id)) {
          try {
            // Verify AR engine is still available
            if (!arEngine.current) {
              throw new Error('AR engine became unavailable during loading');
            }

            await arEngine.current.loadObject(object);
            loadedObjects.current.add(object.id);
            successCount++;
            console.log(`✅ Loaded object: ${object.name} (${object.id})`);
          } catch (error: any) {
            errorCount++;
            console.error(`❌ Failed to load object ${object.name} (${object.id}):`, error.message);
            // Continue loading other objects even if one fails
          }
        }
      }

      // Remove objects that are no longer nearby
      const currentObjectIds = new Set(objectsToLoad.map(obj => obj.id));
      const objectsToRemove: string[] = [];
      
      for (const loadedId of loadedObjects.current) {
        if (!currentObjectIds.has(loadedId)) {
          objectsToRemove.push(loadedId);
        }
      }

      // Remove objects that are no longer in range
      for (const objectId of objectsToRemove) {
        try {
          if (arEngine.current) {
            arEngine.current.removeObject(objectId);
          }
          loadedObjects.current.delete(objectId);
          console.log(`🗑️ Removed object: ${objectId}`);
        } catch (error) {
          console.warn(`Failed to remove object ${objectId}:`, error);
        }
      }

      // Update session state
      if (isMounted.current) {
        setSessionState(prev => ({
          ...prev,
          objectsLoaded: loadedObjects.current.size,
          renderStats: arEngine.current?.getRenderStats() || prev.renderStats,
          error: errorCount > 0 ? `${errorCount} objects failed to load` : null,
        }));
      }

      console.log(`📊 Object loading complete: ${successCount} loaded, ${errorCount} failed, ${objectsToRemove.length} removed`);

    } catch (error: any) {
      console.error('❌ Failed to load AR objects:', error);
      
      if (isMounted.current) {
        setSessionState(prev => ({
          ...prev,
          error: error.message || 'Failed to load AR objects',
        }));
      }

      // Debug system state on error
      debugARSystem();
    }
  }, [opts.renderDistance, opts.maxObjects, waitForAREngine, debugARSystem]);

  // Get objects currently in camera view
  const getObjectsInView = useCallback((): string[] => {
    if (!arEngine.current) {
      console.warn('AR engine not available for getting objects in view');
      return [];
    }
    
    try {
      return arEngine.current.getObjectsInView();
    } catch (error) {
      console.error('Error getting objects in view:', error);
      return [];
    }
  }, []);

  // End AR session with proper cleanup
  const endSession = useCallback(() => {
    console.log('🔚 Ending AR session...');
    
    try {
      if (arEngine.current) {
        arEngine.current.dispose();
        arEngine.current = null;
      }
    } catch (error) {
      console.error('Error disposing AR engine:', error);
    }
    
    canvasRef.current = null;
    loadedObjects.current.clear();
    initializationPromise.current = null;

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

    console.log('✅ AR session ended successfully');
  }, []);

  // Handle canvas resize
  const handleResize = useCallback((width: number, height: number) => {
    if (arEngine.current) {
      try {
        arEngine.current.resize(width, height);
      } catch (error) {
        console.error('Error resizing AR engine:', error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      console.log('🧹 Cleaning up AR hook...');
      isMounted.current = false;
      endSession();
    };
  }, [endSession]);

  // Debug logging when errors occur
  useEffect(() => {
    if (sessionState.error) {
      console.error('AR Session Error:', sessionState.error);
      debugARSystem();
    }
  }, [sessionState.error, debugARSystem]);

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