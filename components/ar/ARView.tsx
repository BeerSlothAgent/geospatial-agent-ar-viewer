import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { useAR } from '@/hooks/useAR';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import AROverlay from './AROverlay';
import ARControls from './ARControls';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ARViewProps {
  objects: DeployedObject[];
  userLocation: LocationData | null;
  onObjectSelect?: (objectId: string) => void;
  onError?: (error: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// WebGL support detection
const isWebGLSupported = (): boolean => {
  if (Platform.OS !== 'web') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

export default function ARView({ 
  objects, 
  userLocation, 
  onObjectSelect, 
  onError 
}: ARViewProps) {
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const maxRetries = 3;

  const {
    sessionState,
    capabilities,
    initializeSession,
    loadObjects,
    getObjectsInView,
    endSession,
    handleResize,
  } = useAR({
    enableDeviceOrientation: true,
    maxObjects: 20,
    renderDistance: 100,
  });

  // Check WebGL support on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      const supported = isWebGLSupported();
      setWebGLSupported(supported);
      
      if (!supported) {
        const errorMessage = 'WebGL is not supported on this device. Please use a modern browser with WebGL support.';
        setInitializationError(errorMessage);
        onError?.(errorMessage);
      }
    }
  }, [onError]);

  // Canvas ref callback to ensure element is available
  const canvasRefCallback = useCallback((element: HTMLCanvasElement | null) => {
    if (element && Platform.OS === 'web') {
      console.log('📱 Canvas element mounted and ready');
      setCanvasElement(element);
    } else if (!element) {
      console.log('📱 Canvas element unmounted');
      setCanvasElement(null);
    }
  }, []);

  // Initialize AR session when canvas is available and WebGL is supported
  useEffect(() => {
    if (
      Platform.OS === 'web' && 
      canvasElement && 
      webGLSupported && 
      !isInitialized && 
      !sessionState.isLoading &&
      !initializationError
    ) {
      initializeAR(canvasElement);
    }
  }, [canvasElement, webGLSupported, isInitialized, sessionState.isLoading, initializationError]);

  // Load objects when they change or user location updates
  useEffect(() => {
    if (sessionState.isActive && objects.length > 0 && userLocation && !sessionState.isLoading) {
      console.log(`🔄 Loading ${objects.length} AR objects at location:`, {
        lat: userLocation.latitude.toFixed(6),
        lng: userLocation.longitude.toFixed(6),
      });
      
      loadObjects(objects, userLocation).catch((error) => {
        console.error('Failed to load objects in ARView:', error);
      });
    }
  }, [objects, userLocation, sessionState.isActive, sessionState.isLoading, loadObjects]);

  // Handle errors from AR session
  useEffect(() => {
    if (sessionState.error) {
      console.error('AR Session Error:', sessionState.error);
      setInitializationError(sessionState.error);
      onError?.(sessionState.error);
    }
  }, [sessionState.error, onError]);

  const initializeAR = async (canvas: HTMLCanvasElement) => {
    if (!canvas) {
      console.error('Canvas element is null during AR initialization');
      return;
    }

    if (!webGLSupported) {
      const errorMessage = 'WebGL is not supported on this device. Please use a modern browser with WebGL support.';
      setInitializationError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      console.log(`🚀 Initializing AR session (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      setInitializationError(null);
      
      const success = await initializeSession(canvas);
      if (success) {
        setIsInitialized(true);
        setRetryCount(0);
        console.log('✅ AR session initialized successfully');
      } else {
        throw new Error('AR session initialization returned false');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize AR';
      console.error('❌ Failed to initialize AR:', errorMessage);
      
      setInitializationError(errorMessage);
      
      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Retrying AR initialization in ${delay}ms...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          if (canvasElement) {
            initializeAR(canvasElement);
          }
        }, delay);
      } else {
        console.error(`❌ AR initialization failed after ${maxRetries + 1} attempts`);
        onError?.(errorMessage);
      }
    }
  };

  const handleCanvasResize = () => {
    if (canvasElement) {
      const { width, height } = Dimensions.get('window');
      handleResize(width, height);
    }
  };

  // Handle window resize for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleCanvasResize);
      return () => window.removeEventListener('resize', handleCanvasResize);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up AR View');
      endSession();
    };
  }, [endSession]);

  // Debug logging
  useEffect(() => {
    console.log('AR View State:', {
      isInitialized,
      sessionActive: sessionState.isActive,
      sessionLoading: sessionState.isLoading,
      sessionError: sessionState.error,
      objectsCount: objects.length,
      userLocation: userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'none',
      capabilities,
      retryCount,
      initializationError,
      webGLSupported,
      canvasAvailable: !!canvasElement,
    });
  }, [
    isInitialized, 
    sessionState.isActive, 
    sessionState.isLoading, 
    sessionState.error,
    objects.length, 
    userLocation, 
    capabilities,
    retryCount,
    initializationError,
    webGLSupported,
    canvasElement
  ]);

  if (Platform.OS !== 'web') {
    // For mobile platforms, we would use a different AR implementation
    // For now, show a placeholder with AR overlay
    return (
      <View style={styles.container}>
        <View style={styles.mobilePlaceholder}>
          <Text style={styles.placeholderText}>
            Mobile AR implementation coming soon
          </Text>
          <Text style={styles.placeholderSubtext}>
            Currently optimized for web browsers
          </Text>
        </View>
        <AROverlay
          sessionState={sessionState}
          capabilities={capabilities}
          objectsInView={[]}
          onObjectSelect={onObjectSelect}
        />
      </View>
    );
  }

  // Show WebGL not supported error
  if (webGLSupported === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorOverlay}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>WebGL Not Supported</Text>
            <Text style={styles.errorMessage}>
              Your browser doesn't support WebGL, which is required for AR functionality. 
              Please use a modern browser like Chrome, Firefox, Safari, or Edge.
            </Text>
            <Text style={styles.finalErrorText}>
              Try updating your browser or enabling hardware acceleration in browser settings.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Show loading while checking WebGL support
  if (webGLSupported === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} />
          <Text style={styles.loadingText}>Checking browser compatibility...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRefCallback}
        style={styles.canvas}
        width={screenWidth}
        height={screenHeight}
      />

      {/* AR Overlay */}
      <AROverlay
        sessionState={sessionState}
        capabilities={capabilities}
        objectsInView={getObjectsInView()}
        onObjectSelect={onObjectSelect}
      />

      {/* AR Controls */}
      <ARControls
        sessionState={sessionState}
        onEndSession={endSession}
        onToggleOrientation={() => {
          console.log('Toggle device orientation tracking');
        }}
      />

      {/* Initialization Error Display */}
      {initializationError && !sessionState.isLoading && webGLSupported && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>AR Initialization Failed</Text>
            <Text style={styles.errorMessage}>{initializationError}</Text>
            {retryCount < maxRetries ? (
              <View style={styles.retryInfo}>
                <LoadingSpinner size={20} />
                <Text style={styles.retryText}>
                  Retrying... (Attempt {retryCount + 1}/{maxRetries + 1})
                </Text>
              </View>
            ) : (
              <Text style={styles.finalErrorText}>
                Please refresh the page to try again
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  mobilePlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff6b35',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  retryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '600',
  },
  finalErrorText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});