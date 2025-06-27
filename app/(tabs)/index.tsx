import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { Camera, MapPin, Zap, Globe, ArrowRight, Play, CircleCheck as CheckCircle, Smartphone, Monitor, Tablet, Navigation, Database } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import ARCameraView from '@/components/camera/CameraView';
import StatusBadge from '@/components/ui/StatusBadge';
import LocationDisplay from '@/components/location/LocationDisplay';
import PreciseLocationService from '@/components/location/PreciseLocationService';
import DatabaseStatus from '@/components/database/DatabaseStatus';
import ObjectsList from '@/components/database/ObjectsList';
import { useLocation } from '@/hooks/useLocation';
import { useDatabase } from '@/hooks/useDatabase';
import { DeployedObject } from '@/types/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomePage() {
  const isMounted = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [showDatabaseDetails, setShowDatabaseDetails] = useState(false);
  const [nearbyObjects, setNearbyObjects] = useState<DeployedObject[]>([]);
  
  // Location hook
  const {
    location,
    error: locationError,
    isLoading: locationLoading,
    hasPermission: hasLocationPermission,
    isWatching: isLocationWatching,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermissions: requestLocationPermissions,
  } = useLocation({
    enableHighAccuracy: true,
    watchPosition: false,
  });

  // Database hook
  const {
    isConnected: isDatabaseConnected,
    isLoading: isDatabaseLoading,
    error: databaseError,
    lastSync,
    getNearbyObjects,
    getObjectById,
    refreshConnection: refreshDatabaseConnection,
    clearError: clearDatabaseError,
  } = useDatabase();
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const pulseAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    // Start animations on mount
    fadeAnim.value = withTiming(1, { duration: 1000 });
    slideAnim.value = withTiming(0, { duration: 800 });
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 20000 }),
      -1,
      false
    );
    
    // Simulate app ready state with mounted check
    const readyTimeout = setTimeout(() => {
      if (isMounted.current) {
        setIsReady(true);
      }
    }, 1500);
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      clearTimeout(readyTimeout);
    };
  }, []);

  // Load nearby objects when location changes
  useEffect(() => {
    if (location && isDatabaseConnected) {
      loadNearbyObjects();
    }
  }, [location, isDatabaseConnected]);

  const loadNearbyObjects = async () => {
    if (!location || !isMounted.current) return;

    try {
      console.log('Loading nearby objects for location:', location);
      const objects = await getNearbyObjects({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_meters: 100,
        limit: 10,
      });
      
      if (isMounted.current) {
        setNearbyObjects(objects);
        console.log(`Loaded ${objects.length} nearby objects`);
      }
    } catch (error) {
      console.error('Failed to load nearby objects:', error);
    }
  };

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const handleStartAR = () => {
    if (!isMounted.current) return;
    console.log('Starting AR experience with', nearbyObjects.length, 'objects');
    setCameraStatus('loading');
    setShowCamera(true);
  };

  const handleCameraReady = () => {
    if (!isMounted.current) return;
    setCameraStatus('ready');
    console.log('Camera ready for AR');
  };

  const handleCameraError = (error: string) => {
    if (!isMounted.current) return;
    setCameraStatus('error');
    console.error('Camera error:', error);
  };

  const handleCloseCamera = () => {
    if (!isMounted.current) return;
    setShowCamera(false);
    setCameraStatus('idle');
    console.log('Camera closed');
  };

  const handleLearnMore = () => {
    if (!isMounted.current) return;
    setShowLocationDetails(true);
  };

  const handleLocationRefresh = () => {
    getCurrentPosition();
  };

  const handleToggleLocationTracking = () => {
    if (isLocationWatching) {
      stopWatching();
    } else {
      startWatching();
    }
  };

  const handleObjectSelect = (object: DeployedObject) => {
    console.log('Selected object:', object);
    // TODO: Navigate to object details or start AR view with specific object
  };

  // Debug information
  const debugInfo = {
    location: location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'None',
    objectsCount: nearbyObjects.length,
    databaseConnected: isDatabaseConnected,
    hasLocationPermission,
  };

  console.log('HomePage Debug Info:', debugInfo);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.heroBackground, rotateStyle]}>
            <View style={styles.gradientOrb} />
          </Animated.View>
          
          <Animated.View style={[styles.heroContent, fadeStyle]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Camera size={32} color="#00d4ff" strokeWidth={2} />
              </View>
              <Text style={styles.logoText}>AR Viewer</Text>
            </View>
            
            <Text style={styles.heroTitle}>
              Precise Geospatial{'\n'}
              <Text style={styles.heroTitleAccent}>AR Experience</Text>
            </Text>
            
            <Text style={styles.heroSubtitle}>
              View 3D objects at exact real-world coordinates with millimeter precision using GEODNET-corrected GPS data
            </Text>
            
            <View style={styles.heroButtons}>
              <Animated.View style={pulseStyle}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleStartAR}
                  activeOpacity={0.8}
                >
                  <Play size={20} color="#000" strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>Start AR Experience</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLearnMore}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>View Location Services</Text>
                <ArrowRight size={16} color="#00d4ff" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Debug Info Display */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>System Status</Text>
              <Text style={styles.debugText}>Location: {debugInfo.location}</Text>
              <Text style={styles.debugText}>Objects: {debugInfo.objectsCount}</Text>
              <Text style={styles.debugText}>Database: {debugInfo.databaseConnected ? 'Connected' : 'Disconnected'}</Text>
              <Text style={styles.debugText}>Location Permission: {debugInfo.hasLocationPermission ? 'Granted' : 'Denied'}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Location Services Section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Location Services</Text>
          
          <LocationDisplay
            location={location}
            error={locationError}
            isLoading={locationLoading}
            hasPermission={hasLocationPermission}
            isWatching={isLocationWatching}
            onRefresh={handleLocationRefresh}
            onRequestPermission={requestLocationPermissions}
            onToggleWatching={handleToggleLocationTracking}
            compact={!showLocationDetails}
          />

          {showLocationDetails && (
            <View style={styles.preciseLocationContainer}>
              <PreciseLocationService
                deviceLocation={location}
                enabled={hasLocationPermission && !!location}
              />
            </View>
          )}

          {!showLocationDetails && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => isMounted.current && setShowLocationDetails(true)}
              activeOpacity={0.7}
            >
              <Navigation size={16} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.expandButtonText}>View Precise Location Details</Text>
              <ArrowRight size={16} color="#00d4ff" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Database Section */}
        <View style={styles.databaseSection}>
          <Text style={styles.sectionTitle}>Database Connection</Text>
          
          <DatabaseStatus
            state={{
              isConnected: isDatabaseConnected,
              isLoading: isDatabaseLoading,
              error: databaseError,
              lastSync,
            }}
            onRefresh={refreshDatabaseConnection}
            onClearError={clearDatabaseError}
            compact={!showDatabaseDetails}
          />

          {showDatabaseDetails && (
            <View style={styles.objectsContainer}>
              <ObjectsList
                objects={nearbyObjects}
                isLoading={isDatabaseLoading}
                error={databaseError?.message}
                onObjectSelect={handleObjectSelect}
                onRefresh={loadNearbyObjects}
              />
            </View>
          )}

          {!showDatabaseDetails && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => isMounted.current && setShowDatabaseDetails(true)}
              activeOpacity={0.7}
            >
              <Database size={16} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.expandButtonText}>View Database Details</Text>
              <ArrowRight size={16} color="#00d4ff" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Core Capabilities</Text>
          
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon={<MapPin size={24} color="#00d4ff" strokeWidth={2} />}
              title="Precise Location"
              description="GEODNET-corrected coordinates for millimeter accuracy"
              delay={0}
            />
            
            <FeatureCard
              icon={<Camera size={24} color="#00d4ff" strokeWidth={2} />}
              title="Live Camera Feed"
              description="Real-time camera integration with AR overlay"
              delay={200}
            />
            
            <FeatureCard
              icon={<Globe size={24} color="#00d4ff" strokeWidth={2} />}
              title="3D Object Rendering"
              description="Render GLTF models at exact geospatial coordinates"
              delay={400}
            />
            
            <FeatureCard
              icon={<Zap size={24} color="#00d4ff" strokeWidth={2} />}
              title="High Performance"
              description="Optimized for smooth 60fps AR experience"
              delay={600}
            />
          </View>
        </View>

        {/* Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>See It In Action</Text>
          
          <View style={styles.demoContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.demoImage}
              resizeMode="cover"
            />
            
            <View style={styles.demoOverlay}>
              <TouchableOpacity 
                style={styles.playButton} 
                activeOpacity={0.8}
                onPress={handleStartAR}
              >
                <Play size={24} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>AR Camera Integration Demo</Text>
              <Text style={styles.demoDescription}>
                Experience live camera feed with AR overlay and object tracking capabilities
              </Text>
            </View>
          </View>
        </View>

        {/* Compatibility Section */}
        <View style={styles.compatibilitySection}>
          <Text style={styles.sectionTitle}>Device Compatibility</Text>
          
          <View style={styles.deviceGrid}>
            <DeviceCard
              icon={<Smartphone size={32} color="#00d4ff" strokeWidth={2} />}
              title="Mobile"
              description="iOS & Android"
              status="Supported"
            />
            
            <DeviceCard
              icon={<Tablet size={32} color="#00d4ff" strokeWidth={2} />}
              title="Tablet"
              description="iPad & Android Tablets"
              status="Supported"
            />
            
            <DeviceCard
              icon={<Monitor size={32} color="#00d4ff" strokeWidth={2} />}
              title="Web"
              description="Chrome, Safari, Edge"
              status="Beta"
            />
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIndicator, { backgroundColor: isReady ? '#00ff88' : '#ff6b35' }]} />
              <Text style={styles.statusTitle}>System Status</Text>
            </View>
            
            <View style={styles.statusItems}>
              <StatusItem label="Camera Access" status={isReady} />
              <StatusItem label="AR Framework" status={isReady} />
              <StatusItem label="Location Services" status={hasLocationPermission && !!location} />
              <StatusItem label="Database Connection" status={isDatabaseConnected} />
            </View>
            
            <View style={styles.statusBadges}>
              <StatusBadge 
                status={isReady ? 'success' : 'pending'} 
                text={isReady ? 'Ready' : 'Initializing'} 
                size="small"
              />
              <StatusBadge 
                status={isDatabaseConnected ? 'success' : 'pending'} 
                text="Phase 5: AR Implementation" 
                size="small"
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built for the AgentSphere ecosystem
          </Text>
          <Text style={styles.footerSubtext}>
            Standalone AR Viewer • Version 1.0.0 • Phase 5
          </Text>
        </View>
      </ScrollView>

      {/* AR Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <ARCameraView
          onClose={handleCloseCamera}
          onCameraReady={handleCameraReady}
          onError={handleCameraError}
          objects={nearbyObjects}
          userLocation={location}
        />
      </Modal>
    </>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  const animValue = useSharedValue(0);
  
  useEffect(() => {
    animValue.value = withDelay(
      delay,
      withTiming(1, { duration: 600 })
    );
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({
    opacity: animValue.value,
    transform: [
      { translateY: interpolate(animValue.value, [0, 1], [30, 0]) },
      { scale: interpolate(animValue.value, [0, 1], [0.9, 1]) },
    ],
  }));
  
  return (
    <Animated.View style={[styles.featureCard, animStyle]}>
      <View style={styles.featureIcon}>
        {icon}
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </Animated.View>
  );
}

// Device Card Component
function DeviceCard({ icon, title, description, status }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceIcon}>
        {icon}
      </View>
      <Text style={styles.deviceTitle}>{title}</Text>
      <Text style={styles.deviceDescription}>{description}</Text>
      <View style={[
        styles.statusBadge,
        { backgroundColor: status === 'Supported' ? '#00ff8820' : '#ff6b3520' }
      ]}>
        <Text style={[
          styles.statusBadgeText,
          { color: status === 'Supported' ? '#00ff88' : '#ff6b35' }
        ]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

// Status Item Component
function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <View style={styles.statusItem}>
      <CheckCircle 
        size={16} 
        color={status ? '#00ff88' : '#666'} 
        strokeWidth={2} 
      />
      <Text style={[styles.statusItemText, { color: status ? '#fff' : '#666' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  
  // Hero Section
  heroSection: {
    height: screenHeight * 0.85,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
  },
  gradientOrb: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
    backgroundColor: '#00d4ff',
    opacity: 0.1,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 16,
  },
  heroTitleAccent: {
    color: '#00d4ff',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 320,
  },
  heroButtons: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d4ff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00d4ff',
  },

  // Debug Info
  debugInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 20,
    minWidth: 300,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  
  // Location Section
  locationSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  preciseLocationContainer: {
    marginTop: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
  },

  // Database Section
  databaseSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  objectsContainer: {
    marginTop: 20,
  },
  
  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresGrid: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  
  // Demo Section
  demoSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  demoContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  demoImage: {
    width: '100%',
    height: 200,
  },
  demoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00d4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoInfo: {
    padding: 20,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  demoDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  
  // Compatibility Section
  compatibilitySection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  deviceGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  deviceCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  deviceIcon: {
    marginBottom: 16,
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  deviceDescription: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Status Section
  statusSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusItems: {
    gap: 12,
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#444',
  },
});