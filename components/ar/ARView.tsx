import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useAR } from '@/hooks/useAR';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import AROverlay from './AROverlay';
import ARControls from './ARControls';

interface ARViewProps {
  objects: DeployedObject[];
  userLocation: LocationData | null;
  onObjectSelect?: (objectId: string) => void;
  onError?: (error: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ARView({ 
  objects, 
  userLocation, 
  onObjectSelect, 
  onError 
}: ARViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<View>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize AR session when component mounts
  useEffect(() => {
    if (Platform.OS === 'web' && canvasRef.current && !isInitialized) {
      initializeAR();
    }
  }, [isInitialized]);

  // Load objects when they change or user location updates
  useEffect(() => {
    if (sessionState.isActive && objects.length > 0 && userLocation) {
      console.log(`Loading ${objects.length} AR objects at location:`, userLocation);
      loadObjects(objects, userLocation);
    }
  }, [objects, userLocation, sessionState.isActive, loadObjects]);

  // Handle errors
  useEffect(() => {
    if (sessionState.error) {
      console.error('AR Session Error:', sessionState.error);
      onError?.(sessionState.error);
    }
  }, [sessionState.error, onError]);

  const initializeAR = async () => {
    if (!canvasRef.current) return;

    try {
      console.log('Initializing AR session...');
      const success = await initializeSession(canvasRef.current);
      if (success) {
        setIsInitialized(true);
        console.log('AR session initialized successfully');
      } else {
        console.error('Failed to initialize AR session');
      }
    } catch (error: any) {
      console.error('Failed to initialize AR:', error);
      onError?.(error.message || 'Failed to initialize AR');
    }
  };

  const handleCanvasResize = () => {
    if (canvasRef.current) {
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
      console.log('Cleaning up AR session');
      endSession();
    };
  }, [endSession]);

  // Debug logging
  useEffect(() => {
    console.log('AR View State:', {
      isInitialized,
      sessionActive: sessionState.isActive,
      objectsCount: objects.length,
      userLocation: userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'none',
      capabilities,
    });
  }, [isInitialized, sessionState.isActive, objects.length, userLocation, capabilities]);

  if (Platform.OS !== 'web') {
    // For mobile platforms, we would use a different AR implementation
    // For now, show a placeholder
    return (
      <View style={styles.container}>
        <View style={styles.mobilePlaceholder}>
          <AROverlay
            sessionState={sessionState}
            capabilities={capabilities}
            objectsInView={[]}
            onObjectSelect={onObjectSelect}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} ref={containerRef}>
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
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
  },
});