import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Camera, MapPin, Zap, ArrowLeft } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { useDatabase } from '@/hooks/useDatabase';
import AgentMapView from '@/components/map/AgentMapView';
import { RangeDetectionService } from '@/services/RangeDetectionService';
import { DeployedObject } from '@/types/database';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [agents, setAgents] = useState<DeployedObject[]>([]);
  const [agentsInRange, setAgentsInRange] = useState<DeployedObject[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  
  // Location hook
  const {
    location,
    error: locationError,
    isLoading: locationLoading,
    hasPermission: hasLocationPermission,
    getCurrentPosition,
  } = useLocation({
    enableHighAccuracy: true,
    watchPosition: true,
  });
  
  // Database hook
  const {
    getNearbyObjects,
    isLoading: databaseLoading,
  } = useDatabase();
  
  // Range detection service
  const rangeService = RangeDetectionService.getInstance();
  
  // Load agents when location changes
  useEffect(() => {
    if (location) {
      loadAgents();
    }
  }, [location]);
  
  // Update range detection service
  useEffect(() => {
    if (location) {
      rangeService.updateUserLocation(location);
    }
    
    if (agents.length > 0) {
      rangeService.updateAgents(agents);
    }
    
    // Subscribe to range updates
    const unsubscribe = rangeService.subscribe((inRangeAgents) => {
      setAgentsInRange(inRangeAgents);
    });
    
    return unsubscribe;
  }, [agents, location]);
  
  // Load agents from database
  const loadAgents = async () => {
    if (!location) return;
    
    try {
      const objects = await getNearbyObjects({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_meters: 1000, // 1km radius
        limit: 50,
      });
      
      setAgents(objects);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };
  
  // Get agent color based on type
  const getAgentColor = (agentType: string): string => {
    const colorMap: Record<string, string> = {
      'ai_agent': '#3B82F6',
      'study_buddy': '#10B981',
      'tutor': '#8B5CF6',
      'landmark': '#F59E0B',
      'building': '#6B7280',
      'Intelligent Assistant': '#7C3AED',
      'Content Creator': '#EF4444',
      'Local Services': '#0891B2',
      'Tutor/Teacher': '#BE185D',
      '3D World Modelling': '#059669',
      'Game Agent': '#9333EA',
      'test-object': '#3B82F6',
      'info-sphere': '#10B981',
      'test-cube': '#EC4899',
      'test-sphere': '#F59E0B'
    };
    
    return colorMap[agentType] || '#00d4ff';
  };
  
  // Switch to camera/AR view
  const handleSwitchToCamera = () => {
    router.navigate('/');
  };
  
  return location ? (
    <AgentMapView
      userLocation={location}
      agents={agents}
      onClose={() => router.navigate('/')}
      onSwitchToCamera={handleSwitchToCamera}
      onAgentSelect={(agent) => {
        console.log('Selected agent:', agent.name);
        // Handle agent selection
        setSelectedAgent(agent);
      }}
    />
  ) : (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Getting location...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  }
});