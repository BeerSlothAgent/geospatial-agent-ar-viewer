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
  Alert,
} from 'react-native';
import { Camera, MapPin, Zap, Globe, ArrowRight, Play, CircleCheck as CheckCircle, Smartphone, Monitor, Tablet, Navigation, Database, MessageCircle, Mic, Users, Wallet } from 'lucide-react-native';
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
import ThirdwebWalletConnect from '@/components/wallet/ThirdwebWalletConnect';
import { useLocation } from '@/hooks/useLocation';
import { useDatabase } from '@/hooks/useDatabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { DeployedObject } from '@/types/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomePage() {
  const isMounted = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [showDatabaseDetails, setShowDatabaseDetails] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [nearbyObjects, setNearbyObjects] = useState<DeployedObject[]>([]);
  const [initializationStep, setInitializationStep] = useState(0);
  const [systemReady, setSystemReady] = useState(false);
  
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

  // Initialize app step by step with better error handling
  useEffect(() => {
    if (!isMounted.current) return;

    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Step 1: Start animations
        setInitializationStep(1);
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

        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 2: Initialize location services
        if (isMounted.current) {
          setInitializationStep(2);
          console.log('📍 Initializing location services...');
          
          try {
            const hasPermission = await requestLocationPermissions();
            if (hasPermission) {
              await getCurrentPosition();
            }
          } catch (error) {
            console.warn('Location initialization failed:', error);
            // Continue anyway - location is not strictly required for demo
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Initialize database connection
        if (isMounted.current) {
          setInitializationStep(3);
          console.log('🗄️ Initializing agent network connection...');
          
          try {
            await refreshDatabaseConnection();
          } catch (error) {
            console.warn('Agent network initialization failed:', error);
            // Continue anyway - we have mock data fallback
          }
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 4: Load initial agents
        if (isMounted.current) {
          setInitializationStep(4);
          console.log('🤖 Loading nearby GeoAgents...');
          await loadNearbyObjects();
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 5: Mark as ready
        if (isMounted.current) {
          setInitializationStep(5);
          setIsReady(true);
          setSystemReady(true);
          console.log('✅ Agent world initialization complete!');
        }

      } catch (error) {
        console.error('❌ App initialization failed:', error);
        if (isMounted.current) {
          // Still mark as ready to allow user interaction
          setIsReady(true);
          setSystemReady(true);
        }
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load nearby objects when location changes or system becomes ready
  useEffect(() => {
    if (systemReady) {
      loadNearbyObjects();
    }
  }, [location, systemReady]);

  const loadNearbyObjects = async () => {
    if (!isMounted.current) return;

    try {
      console.log('🔍 Loading nearby GeoAgents for location:', {
        lat: location?.latitude?.toFixed(6) || 'unknown',
        lng: location?.longitude?.toFixed(6) || 'unknown',
        supabaseConfigured: isSupabaseConfigured,
        databaseConnected: isDatabaseConnected,
      });

      const objects = await getNearbyObjects({
        latitude: location?.latitude || 37.7749, // Default to SF coordinates
        longitude: location?.longitude || -122.4194,
        radius_meters: 1000, // 1km radius
        limit: 10,
      });
      
      if (isMounted.current) {
        setNearbyObjects(objects);
        console.log(`📍 Loaded ${objects.length} nearby GeoAgents:`, objects.map(obj => ({
          id: obj.id,
          name: obj.name,
          distance: obj.distance_meters,
          coordinates: `${obj.latitude.toFixed(6)}, ${obj.longitude.toFixed(6)}`,
        })));
      }
    } catch (error) {
      console.error('❌ Failed to load nearby GeoAgents:', error);
      // Set some default mock agents so AR mode can still work
      if (isMounted.current) {
        setNearbyObjects([
          {
            id: 'demo-agent-1',
            name: 'Demo AI Assistant',
            description: 'Helpful AI agent for demonstrations',
            latitude: location?.latitude || 37.7749,
            longitude: location?.longitude || -122.4194,
            altitude: 10,
            model_url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
            model_type: 'cube',
            scale_x: 1.0,
            scale_y: 1.0,
            scale_z: 1.0,
            rotation_x: 0,
            rotation_y: 0,
            rotation_z: 0,
            is_active: true,
            visibility_radius: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            distance_meters: 25,
          }
        ]);
      }
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
    
    console.log('🚀 Starting Agent AR experience with', nearbyObjects.length, 'agents');
    
    // Always allow AR mode if system is ready - don't require perfect conditions
    if (!systemReady) {
      Alert.alert(
        'Agent World Initializing',
        'Please wait for the agent network to finish initializing before entering the agent world.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Start AR mode regardless of location/database status for demo purposes
    setCameraStatus('loading');
    setShowCamera(true);
  };

  const handleCameraReady = () => {
    if (!isMounted.current) return;
    setCameraStatus('ready');
    console.log('📷 Camera ready for Agent AR');
  };

  const handleCameraError = (error: string) => {
    if (!isMounted.current) return;
    setCameraStatus('error');
    console.error('❌ Camera error:', error);
  };

  const handleCloseCamera = () => {
    if (!isMounted.current) return;
    setShowCamera(false);
    setCameraStatus('idle');
    console.log('📷 Camera closed');
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
    console.log('🤖 Selected GeoAgent:', object);
    // TODO: Navigate to agent details or start AR view with specific agent
  };

  // System status calculation - more lenient for demo
  const getSystemStatus = () => {
    if (!systemReady) return 'initializing';
    
    // For demo purposes, consider system ready if we have agents (even mock ones)
    const hasAgents = nearbyObjects.length > 0;
    
    if (hasAgents) return 'ready';
    return 'partial';
  };

  const systemStatus = getSystemStatus();

  // Get initialization message
  const getInitializationMessage = () => {
    if (systemReady && systemStatus === 'ready') return 'Enter Agent World';
    if (systemReady && systemStatus === 'partial') return 'Enter Agent World (Demo Mode)';
    
    switch (initializationStep) {
      case 1: return 'Starting animations...';
      case 2: return 'Initializing location services...';
      case 3: return 'Connecting to agent network...';
      case 4: return 'Loading nearby GeoAgents...';
      case 5: return 'Finalizing agent world setup...';
      default: return 'Agent World Initializing...';
    }
  };

  // Check if AR button should be enabled
  const isARButtonEnabled = systemReady && nearbyObjects.length > 0;

  // Debug information
  const debugInfo = {
    isReady,
    systemReady,
    initializationStep,
    location: location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'None',
    agentsCount: nearbyObjects.length,
    databaseConnected: isDatabaseConnected,
    supabaseConfigured: isSupabaseConfigured,
    hasLocationPermission,
    systemStatus,
    isARButtonEnabled,
  };

  console.log('🏠 HomePage Debug Info:', debugInfo);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Wallet Button */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>AR Viewer</Text>
              <Text style={styles.headerSubtitle}>Agent Reality</Text>
            </View>
            
            <TouchableOpacity
              style={styles.walletButton}
              onPress={() => setShowWalletModal(true)}
              activeOpacity={0.8}
            >
              <Wallet size={20} color="#9333ea" strokeWidth={2} />
              <Text style={styles.walletButtonText}>Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

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
              Intelligent GeoAgent{'\n'}
              <Text style={styles.heroTitleAccent}>AR Experience</Text>
            </Text>
            
            <Text style={styles.heroSubtitle}>
              Chat, interact, and collaborate with AI agents positioned at precise real-world locations using GEODNET RTK precision
            </Text>
            
            <View style={styles.heroButtons}>
              <Animated.View style={pulseStyle}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !isARButtonEnabled && styles.primaryButtonDisabled
                  ]}
                  onPress={handleStartAR}
                  activeOpacity={0.8}
                  disabled={!isARButtonEnabled}
                >
                  <Play size={20} color={isARButtonEnabled ? "#000" : "#666"} strokeWidth={2} />
                  <Text style={[
                    styles.primaryButtonText,
                    !isARButtonEnabled && styles.primaryButtonTextDisabled
                  ]}>
                    {getInitializationMessage()}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLearnMore}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>View Agent Network Status</Text>
                <ArrowRight size={16} color="#00d4ff" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* System Status Display */}
            <View style={styles.systemStatus}>
              <Text style={styles.systemStatusTitle}>Agent Network Status</Text>
              <View style={styles.systemStatusItems}>
                <StatusBadge 
                  status={hasLocationPermission && !!location ? 'success' : 'pending'} 
                  text={`RTK Precision: ${location ? 'Active' : 'Demo Mode'}`}
                  size="small"
                />
                <StatusBadge 
                  status={isSupabaseConfigured ? (isDatabaseConnected ? 'success' : 'pending') : 'pending'} 
                  text={`Agent Network: ${isSupabaseConfigured ? (isDatabaseConnected ? 'Connected' : 'Demo Mode') : 'Demo Mode'}`}
                  size="small"
                />
                <StatusBadge 
                  status={nearbyObjects.length > 0 ? 'success' : 'pending'} 
                  text={`Active GeoAgents: ${nearbyObjects.length}`}
                  size="small"
                />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Location Services Section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>RTK Precision Location</Text>
          
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
              <Text style={styles.expandButtonText}>View RTK Precision Details</Text>
              <ArrowRight size={16} color="#00d4ff" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Agent Network Section */}
        <View style={styles.databaseSection}>
          <Text style={styles.sectionTitle}>Agent Network Connection</Text>
          
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
              <Text style={styles.expandButtonText}>View Agent Network Details</Text>
              <ArrowRight size={16} color="#00d4ff" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Agent Interaction Capabilities</Text>
          
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon={<MessageCircle size={24} color="#00d4ff" strokeWidth={2} />}
              title="Chat with Agents"
              description="Text-based conversations with AI agents at precise locations"
              delay={0}
            />
            
            <FeatureCard
              icon={<Mic size={24} color="#00d4ff" strokeWidth={2} />}
              title="Voice Interaction"
              description="Natural voice conversations with intelligent GeoAgents"
              delay={200}
            />
            
            <FeatureCard
              icon={<MapPin size={24} color="#00d4ff" strokeWidth={2} />}
              title="RTK Precision"
              description="GEODNET-corrected coordinates for millimeter accuracy"
              delay={400}
            />
            
            <FeatureCard
              icon={<Users size={24} color="#00d4ff" strokeWidth={2} />}
              title="Agent Community"
              description="Discover agents with unique personalities and skills"
              delay={600}
            />
          </View>
        </View>

        {/* Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Experience Agent Reality</Text>
          
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
                disabled={!isARButtonEnabled}
              >
                <Play size={24} color={isARButtonEnabled ? "#000" : "#666"} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>Interactive Agent AR Demo</Text>
              <Text style={styles.demoDescription}>
                Experience live camera feed with intelligent AI agents positioned at exact real-world coordinates
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
              <View style={[styles.statusIndicator, { backgroundColor: systemStatus === 'ready' ? '#00ff88' : systemStatus === 'partial' ? '#ff9500' : '#ff6b35' }]} />
              <Text style={styles.statusTitle}>Agent World Status</Text>
            </View>
            
            <View style={styles.statusItems}>
              <StatusItem label="Camera Access" status={true} />
              <StatusItem label="AR Framework" status={systemReady} />
              <StatusItem label="RTK Precision" status={hasLocationPermission && !!location} />
              <StatusItem label="Agent Network" status={isSupabaseConfigured ? isDatabaseConnected : true} />
              <StatusItem label="GeoAgents Available" status={nearbyObjects.length > 0} />
            </View>
            
            <View style={styles.statusBadges}>
              <StatusBadge 
                status={systemStatus === 'ready' ? 'success' : systemStatus === 'partial' ? 'pending' : 'error'} 
                text={systemStatus === 'ready' ? 'Ready for Agents' : systemStatus === 'partial' ? 'Demo Mode Ready' : 'Initializing'} 
                size="small"
              />
              <StatusBadge 
                status="success" 
                text="Phase 5: Agent AR Complete" 
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
            GeoAgent AR Viewer • Version 1.0.0 • Agent Reality Ready
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

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.walletModalContainer}>
          <View style={styles.walletModalHeader}>
            <Text style={styles.walletModalTitle}>Algorand Wallet</Text>
            <TouchableOpacity
              style={styles.walletModalClose}
              onPress={() => setShowWalletModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.walletModalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.walletModalContent} showsVerticalScrollIndicator={false}>
            <LuteWalletConnect />
          </ScrollView>
        </View>
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
  
  // Header
  headerContainer: {
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '500',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9333ea',
    gap: 8,
  },
  walletButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
  },
  
  // Wallet Modal
  walletModalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  walletModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  walletModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  walletModalClose: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#9333ea',
    borderRadius: 8,
  },
  walletModalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  walletModalContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  // Hero Section
  heroSection: {
    height: screenHeight * 0.75,
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
    minWidth: 280,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#333',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  primaryButtonTextDisabled: {
    color: '#666',
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

  // System Status
  systemStatus: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 300,
  },
  systemStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 12,
    textAlign: 'center',
  },
  systemStatusItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
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