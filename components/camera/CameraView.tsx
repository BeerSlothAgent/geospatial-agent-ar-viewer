import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, X, CircleAlert as AlertCircle, Settings, Zap, ZapOff } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraViewProps {
  onClose: () => void;
  onCameraReady?: () => void;
  onError?: (error: string) => void;
}

export default function ARCameraView({ onClose, onCameraReady, onError }: CameraViewProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  }, []);

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
    onCameraReady?.();
  };

  // Handle camera errors
  const handleCameraError = (error: any) => {
    const errorMessage = error?.message || 'Camera error occurred';
    setError(errorMessage);
    onError?.(errorMessage);
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Toggle flash
  const toggleFlash = () => {
    if (Platform.OS !== 'web') {
      setIsFlashOn(!isFlashOn);
    }
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

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#ff6b35" strokeWidth={2} />
          <Text style={styles.errorTitle}>Camera Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsCameraReady(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
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

  // Main camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={handleCameraReady}
        onMountError={handleCameraError}
        flash={isFlashOn ? 'on' : 'off'}
      >
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

          {/* AR Scanning Line */}
          <Animated.View style={[styles.scanLine, scanLineStyle]} />

          {/* Center Crosshair */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairLine} />
            <View style={[styles.crosshairLine, styles.crosshairLineVertical]} />
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
              <Text style={styles.arInfoText}>Point camera at your surroundings</Text>
              <Text style={styles.arInfoSubtext}>AR objects will appear when detected</Text>
            </View>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              activeOpacity={0.7}
            >
              <RotateCcw size={24} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* AR Object Indicators (placeholder for future objects) */}
          <View style={styles.arIndicators}>
            <Animated.View style={[styles.arIndicator, pulseStyle]}>
              <Text style={styles.arIndicatorText}>0</Text>
              <Text style={styles.arIndicatorLabel}>Objects</Text>
            </Animated.View>
          </View>
        </Animated.View>
      </CameraView>
    </View>
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
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  
  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    opacity: 0.8,
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
});