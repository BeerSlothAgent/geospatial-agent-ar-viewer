import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, X, CircleAlert as AlertCircle, Settings, Zap, ZapOff, Cuboid as Cube, RefreshCw } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import ARView from '@/components/ar/ARView';
import ARAgentScene from '@/components/ar/ARAgentScene';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraViewProps {
  onClose: () => void;
  onCameraReady?: () => void;
  onError?: (error: string) => void;
  objects?: DeployedObject[];
  userLocation?: LocationData | null;
}

export default function ARCameraView({ 
  onClose, 
  onCameraReady, 
  onError,
  objects = [],
  userLocation = null,
}: CameraViewProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showARView, setShowARView] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [visibleARObjects, setVisibleARObjects] = useState<any[]>([]);
  
  const cameraRef = useRef<CameraView>(null);
  
  // Animation values
  const pulseAnim = useSharedValue(1);
  const fadeAnim = useSharedValue(0);
  const scanLineAnim = useSharedValue(-100);

  useEffect(() => {
    // Start UI animations
    fadeAnim.value = withTiming(1, { duration: 500 });
    
    // Scanning animation
    scanLineAnim.value = withRepeat(
      withSequence(
        withTiming(screenHeight + 100, { duration: 2000 }),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    );
    
    // Pulse animation for AR indicators
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Log camera initialization
    console.log('📷 Camera component initialized with:', {
      objectsCount: objects.length,
      hasLocation: !!userLocation,
      locationCoords: userLocation ? `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}` : 'none'
    });
  }, []);

  // Process objects for AR display when they change
  useEffect(() => {
    if (objects && objects.length > 0 && userLocation && isCameraReady) {
      console.log('🎯 Processing', objects.length, 'objects for AR display');
      
      // Filter nearby objects (within 1km for AR display)
      const nearbyObjects = objects.filter(obj => {
        const distance = obj.distance_meters || 0;
        return distance <= 1000; // 1km radius for AR
      });

      console.log('🎯 Found', nearbyObjects.length, 'nearby objects for AR');
      
      // Transform objects for AR positioning
      const arObjects = nearbyObjects.map((obj, index) => {
        // Simple positioning logic - distribute objects across screen
        const x = (index % 3) * (screenWidth / 3) + 50; // 3 columns
        const y = Math.floor(index / 3) * 150 + 200; // Rows with spacing
        
        return {
          id: obj.id,
          name: obj.name || 'Unnamed Object',
          x: Math.min(x, screenWidth - 100), // Keep within screen bounds
          y: Math.min(y, screenHeight - 100),
          distance: obj.distance_meters ? obj.distance_meters / 1000 : 0, // Convert to km
          type: obj.object_type || 'sphere',
          modelType: obj.model_type || 'gltf'
        };
      });

      setVisibleARObjects(arObjects);
      console.log('🎯 AR objects positioned:', arObjects);
    }
  }, [objects, userLocation, isCameraReady, screenWidth, screenHeight]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineAnim.value }],
  }));

  // Handle camera ready
  const handleCameraReady = () => {
    setIsCameraReady(true);
    setError(null); // Clear any previous errors
    setRetryCount(0); // Reset retry count on success
    onCameraReady?.();
    console.log('📷 Camera ready for AR overlay');
  };

  // Enhanced camera error handling
  const handleCameraError = (error: any) => {
    const errorMessage = error?.message || 'Camera error occurred';
    setError(errorMessage);
    onError?.(errorMessage);
    console.error('❌ Camera error:', error);
    
    // Auto-retry for device in use errors (up to 3 times)
    if (errorMessage.toLowerCase().includes('device in use') && retryCount < 3) {
      console.log(`🔄 Auto-retrying camera initialization (attempt ${retryCount + 1}/3)...`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsCameraReady(false);
      }, 2000);
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    console.log('📷 Camera facing toggled to:', facing === 'back' ? 'front' : 'back');
  };

  // Toggle flash
  const toggleFlash = () => {
    if (Platform.OS !== 'web') {
      setIsFlashOn(!isFlashOn);
      console.log('💡 Flash toggled:', !isFlashOn);
    }
  };

  // Start full AR mode with Three.js
  const startFullARMode = () => {
    console.log('🚀 Starting full AR mode with Three.js:', {
      objectsCount: objects.length,
      hasLocation: !!userLocation,
      locationCoords: userLocation ? `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}` : 'none'
    });

    if (objects.length === 0) {
      Alert.alert(
        'No AR Objects',
        'No AR objects are available in your current location. The system will show demo objects for testing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue with Demo', onPress: () => setShowARView(true) }
        ]
      );
      return;
    }

    if (!userLocation) {
      Alert.alert(
        'Location Required',
        'Location services are required for AR functionality. Please enable location access.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowARView(true);
  };

  // Request permissions with user-friendly messaging
  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to provide AR functionality. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On web, we can't open settings, so show instructions
              if (Platform.OS === 'web') {
                Alert.alert(
                  'Enable Camera Access',
                  'Please click the camera icon in your browser\'s address bar and allow camera access, then refresh the page.'
                );
              }
            }},
          ]
        );
      }
    } catch (error) {
      setError('Failed to request camera permission');
    }
  };

  // Get error details for better user messaging
  const getErrorDetails = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('device in use') || lowerError.includes('in use')) {
      return {
        title: 'Camera Already in Use',
        message: 'The camera is currently being used by another application or browser tab. Please close other apps or tabs that might be using the camera and try again.',
        actionText: 'Try Again',
        showRefreshTip: true,
        showAutoRetry: retryCount > 0,
        canRetry: true
      };
    }
    
    if (lowerError.includes('permission') || lowerError.includes('denied')) {
      return {
        title: 'Camera Permission Denied',
        message: 'Camera access was denied. Please enable camera permissions in your browser or device settings.',
        actionText: 'Grant Permission',
        showRefreshTip: false,
        showAutoRetry: false,
        canRetry: true
      };
    }
    
    if (lowerError.includes('not found') || lowerError.includes('no camera')) {
      return {
        title: 'No Camera Found',
        message: 'No camera device was detected. Please ensure your device has a camera and it\'s properly connected.',
        actionText: 'Try Again',
        showRefreshTip: false,
        showAutoRetry: false,
        canRetry: true
      };
    }
    
    if (lowerError.includes('not supported') || lowerError.includes('unsupported')) {
      return {
        title: 'Camera Not Supported',
        message: 'Camera functionality is not supported on this device or browser. Please try using a different browser or device.',
        actionText: 'Close',
        showRefreshTip: false,
        showAutoRetry: false,
        canRetry: false
      };
    }
    
    // Default error handling
    return {
      title: 'Camera Error',
      message: errorMessage,
      actionText: 'Try Again',
      showRefreshTip: false,
      showAutoRetry: false,
      canRetry: true
    };
  };

  // Manual retry function
  const handleRetry = () => {
    console.log('🔄 Manual camera retry initiated...');
    setError(null);
    setIsCameraReady(false);
    setRetryCount(0);
  };

  // Loading state while permissions are being checked
  if (!permission) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingIcon, pulseStyle]}>
            <Camera size={48} color="#00d4ff" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.loadingText}>Initializing Camera...</Text>
        </View>
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.permissionContainer, fadeStyle]}>
          <View style={styles.permissionIcon}>
            <AlertCircle size={64} color="#ff6b35" strokeWidth={2} />
          </View>
          
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            AR Viewer needs camera access to display the live camera feed and overlay 3D objects in augmented reality.
          </Text>
          
          <View style={styles.permissionFeatures}>
            <View style={styles.featureItem}>
              <Camera size={20} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.featureText}>Live camera feed for AR background</Text>
            </View>
            <View style={styles.featureItem}>
              <Zap size={20} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.featureText}>Real-time object tracking</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#666" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // Error state with improved messaging
  if (error) {
    const errorDetails = getErrorDetails(error);
    
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#ff6b35" strokeWidth={2} />
          <Text style={styles.errorTitle}>{errorDetails.title}</Text>
          <Text style={styles.errorMessage}>{errorDetails.message}</Text>
          
          {errorDetails.showAutoRetry && (
            <View style={styles.autoRetryContainer}>
              <RefreshCw size={16} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.autoRetryText}>
                Auto-retry attempt {retryCount}/3 in progress...
              </Text>
            </View>
          )}
          
          {errorDetails.showRefreshTip && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipTitle}>💡 Troubleshooting Tips:</Text>
              <Text style={styles.tipText}>
                • Close other browser tabs that might be using the camera
              </Text>
              <Text style={styles.tipText}>
                • Close other applications that might be using the camera
              </Text>
              <Text style={styles.tipText}>
                • Refresh the page and try again
              </Text>
              <Text style={styles.tipText}>
                • Try switching to a different camera (front/back)
              </Text>
            </View>
          )}
          
          {errorDetails.canRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <RefreshCw size={16} color="#000" strokeWidth={2} />
              <Text style={styles.retryButtonText}>{errorDetails.actionText}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#666" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main camera view with AR overlay
  return (
    <View style={styles.container}>
      {/* Camera View - NO CHILDREN INSIDE */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={handleCameraReady}
        onMountError={handleCameraError}
        flash={isFlashOn ? 'on' : 'off'}
      />

      {/* AR Objects Overlay - ABSOLUTELY POSITIONED ON TOP */}
      {isCameraReady && (
        <View style={styles.arOverlay}>
          {/* Enhanced 3D AR Objects Scene */}
          <ARAgentScene 
            agents={objects}
            userLocation={userLocation}
            onAgentSelect={(agent) => {
              console.log('🎯 Agent selected:', agent.name);
              Alert.alert('Agent Interaction', `Interacting with ${agent.name}\nDistance: ${agent.distance_meters ? (agent.distance_meters / 1000).toFixed(2) : '?'}km`);
            }}
          />
          
          {/* AR Status Info */}
          <View style={styles.arStatus}>
            <Text style={styles.arStatusText}>
              AR Objects: {objects.length}
            </Text>
            {userLocation && (
              <Text style={styles.arStatusText}>
                Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
            )}
            <Text style={styles.arStatusText}>
              Camera: {facing} • Ready for AR
            </Text>
          </View>

          {/* AR Scanning Line */}
          <Animated.View style={[styles.scanLine, scanLineStyle]} />

          {/* Center Crosshair */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairLine} />
            <View style={[styles.crosshairLine, styles.crosshairLineVertical]} />
          </View>
        </View>
      )}

      {/* AR Overlay UI */}
      <Animated.View style={[styles.overlay, fadeStyle]}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.statusIndicator}>
            <Animated.View style={[styles.statusDot, pulseStyle]} />
            <Text style={styles.statusText}>AR Ready</Text>
          </View>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {/* TODO: Open AR settings */}}
            activeOpacity={0.7}
          >
            <Settings size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* AR Mode Button */}
        <View style={styles.arModeContainer}>
          <TouchableOpacity
            style={styles.arModeButton}
            onPress={startFullARMode}
            activeOpacity={0.8}
          >
            <Animated.View style={pulseStyle}>
              <Cube size={24} color="#000" strokeWidth={2} />
            </Animated.View>
            <Text style={styles.arModeButtonText}>Full AR Mode</Text>
          </TouchableOpacity>
          
          <Text style={styles.objectsAvailable}>
            {objects.length > 0 
              ? `${objects.length} objects visible • Tap to interact`
              : 'Demo objects available for testing'
            }
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
            activeOpacity={0.7}
            disabled={Platform.OS === 'web'}
          >
            {isFlashOn ? (
              <Zap size={24} color="#00d4ff" strokeWidth={2} />
            ) : (
              <ZapOff size={24} color="#fff" strokeWidth={2} />
            )}
          </TouchableOpacity>
          
          <View style={styles.arInfo}>
            <Text style={styles.arInfoText}>AR Objects Overlaid on Camera</Text>
            <Text style={styles.arInfoSubtext}>
              {visibleARObjects.length > 0 
                ? `${visibleARObjects.length} objects visible • Tap to interact`
                : 'Move camera to find AR objects'
              }
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraFacing}
            activeOpacity={0.7}
          >
            <RotateCcw size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* AR Object Indicators */}
        <View style={styles.arIndicators}>
          <Animated.View style={[styles.arIndicator, pulseStyle]}>
            <Text style={styles.arIndicatorText}>{objects.length}</Text>
            <Text style={styles.arIndicatorLabel}>Visible</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Loading State */}
      {!isCameraReady && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Initializing AR Camera...</Text>
          <Text style={styles.loadingSubtext}>
            Preparing to overlay {objects.length} AR objects
          </Text>
        </View>
      )}

      {/* Full AR View Modal with Three.js */}
      <Modal
        visible={showARView}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <ARView
          objects={objects}
          userLocation={userLocation}
          onObjectSelect={(objectId) => {
            console.log('🎯 Selected AR object:', objectId);
          }}
          onError={(error) => {
            console.error('❌ AR View error:', error);
            Alert.alert('AR Error', error);
            setShowARView(false);
          }}
        />
        <TouchableOpacity
          style={styles.arCloseButton}
          onPress={() => {
            console.log('🔚 Closing full AR view');
            setShowARView(false);
          }}
          activeOpacity={0.7}
        >
          <X size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Loading Spinner Component
function LoadingSpinner({ size }: { size: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <RefreshCw size={size} color="#00d4ff" strokeWidth={2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Camera
  camera: {
    flex: 1,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Permission State
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#0a0a0a',
  },
  permissionIcon: {
    marginBottom: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionFeatures: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 12,
  },
  permissionButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#0a0a0a',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  autoRetryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  autoRetryText: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '600',
  },
  tipContainer: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    alignSelf: 'stretch',
  },
  tipTitle: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#00d4ff',
    lineHeight: 20,
    marginBottom: 4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d4ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  
  // AR Overlay (positioned absolutely on top of camera)
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none', // Allow touches on children but not background
  },
  
  // AR Objects
  arObject: {
    position: 'absolute',
    alignItems: 'center',
  },
  arObjectVisual: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 212, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  arObjectIcon: {
    fontSize: 24,
    color: 'white',
  },
  arObjectLabel: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.5)',
  },
  arObjectName: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  arObjectDistance: {
    color: '#00d4ff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  arObjectType: {
    color: '#aaa',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  
  // AR Status
  arStatus: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  arStatusText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  
  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  
  // Controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    pointerEvents: 'auto',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    pointerEvents: 'auto',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Status
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  
  // AR Elements
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00d4ff',
    opacity: 0.6,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
  },
  crosshairLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#00d4ff',
    opacity: 0.8,
  },
  crosshairLineVertical: {
    top: 0,
    bottom: 0,
    left: '50%',
    right: 'auto',
    width: 1,
    height: 'auto',
  },

  // AR Mode
  arModeContainer: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: [{ translateX: -80 }],
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  arModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d4ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  arModeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  objectsAvailable: {
    fontSize: 12,
    color: '#00d4ff',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // AR Info
  arInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  arInfoText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  arInfoSubtext: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // AR Indicators
  arIndicators: {
    position: 'absolute',
    top: 120,
    right: 20,
    pointerEvents: 'none',
  },
  arIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  arIndicatorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00d4ff',
  },
  arIndicatorLabel: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },

  // AR Close Button
  arCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});