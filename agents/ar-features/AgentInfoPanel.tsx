import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MapPin, Clock, User, Eye, Zap, Navigation, Star } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

interface AgentInfoPanelProps {
  agent: DeployedObject;
  userLocation: LocationData | null;
  onBack: () => void;
}

export default function AgentInfoPanel({ agent, userLocation, onBack }: AgentInfoPanelProps) {
  const calculateDistance = () => {
    if (!userLocation) return 0;
    return agent.distance_meters || 0;
  };

  const formatCoordinate = (value: number, type: 'lat' | 'lng'): string => {
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  const getAgentTypeDescription = () => {
    switch (agent.object_type) {
      case 'Home Personal':
        return 'A personal assistant agent for home automation, scheduling, and daily tasks.';
      case 'Landmark':
        return 'Provides information about historical sites, monuments, and points of interest.';
      case 'Intelligent Assistant':
        return 'General-purpose AI assistant capable of answering questions and helping with various tasks.';
      case 'Content Creator':
        return 'Specializes in creating and sharing digital content, art, and creative works.';
      case 'Local Services':
        return 'Connects you with local businesses, services, and community resources.';
      case 'Tutor/Teacher':
        return 'Educational agent that provides tutoring, lessons, and learning assistance.';
      case '3D World Modelling':
        return 'Specializes in spatial visualization, 3D modeling, and architectural planning.';
      case 'Game Agent':
        return 'Interactive gaming companion for entertainment and recreational activities.';
      default:
        return 'An AI agent designed to assist and interact with users.';
    }
  };

  const getCapabilities = () => {
    const capabilities = [];
    
    // Default capabilities
    capabilities.push('Text Chat');
    capabilities.push('Voice Interaction');
    
    // Type-specific capabilities
    switch (agent.object_type) {
      case 'Home Personal':
        capabilities.push('Smart Home Control');
        capabilities.push('Schedule Management');
        capabilities.push('Weather Updates');
        break;
      case 'Landmark':
        capabilities.push('Historical Information');
        capabilities.push('Navigation Assistance');
        capabilities.push('Tourist Guidance');
        break;
      case 'Intelligent Assistant':
        capabilities.push('Question Answering');
        capabilities.push('Research Assistance');
        capabilities.push('Problem Solving');
        break;
      case 'Content Creator':
        capabilities.push('Content Sharing');
        capabilities.push('Creative Collaboration');
        capabilities.push('Art Generation');
        break;
      case 'Local Services':
        capabilities.push('Business Directory');
        capabilities.push('Service Recommendations');
        capabilities.push('Local Information');
        break;
      case 'Tutor/Teacher':
        capabilities.push('Educational Content');
        capabilities.push('Quiz Generation');
        capabilities.push('Learning Assessment');
        break;
      case '3D World Modelling':
        capabilities.push('Spatial Visualization');
        capabilities.push('3D Model Creation');
        capabilities.push('Architectural Planning');
        break;
      case 'Game Agent':
        capabilities.push('Interactive Games');
        capabilities.push('Entertainment');
        capabilities.push('Social Activities');
        break;
    }
    
    return capabilities;
  };

  const distance = calculateDistance();
  const capabilities = getCapabilities();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Agent Header */}
      <View style={styles.headerContainer}>
        <View style={styles.agentIcon}>
          <Text style={styles.agentEmoji}>
            {agent.object_type === 'Home Personal' ? '🏠' :
             agent.object_type === 'Landmark' ? '📍' :
             agent.object_type === 'Intelligent Assistant' ? '🤖' :
             agent.object_type === 'Content Creator' ? '🎨' :
             agent.object_type === 'Local Services' ? '🏪' :
             agent.object_type === 'Tutor/Teacher' ? '👨‍🏫' :
             agent.object_type === '3D World Modelling' ? '🌍' :
             agent.object_type === 'Game Agent' ? '🎮' : '🤖'}
          </Text>
        </View>
        <Text style={styles.agentName}>{agent.name}</Text>
        <Text style={styles.agentType}>{agent.object_type}</Text>
        {agent.description && (
          <Text style={styles.agentDescription}>{agent.description}</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MapPin size={20} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.statValue}>{distance.toFixed(1)}m</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statItem}>
          <Eye size={20} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.statValue}>{agent.visibility_radius || 50}m</Text>
          <Text style={styles.statLabel}>Range</Text>
        </View>
        
        <View style={styles.statItem}>
          <Clock size={20} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.statValue}>
            {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'Unknown'}
          </Text>
          <Text style={styles.statLabel}>Deployed</Text>
        </View>
      </View>

      {/* Agent Type Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About This Agent</Text>
        <Text style={styles.typeDescription}>{getAgentTypeDescription()}</Text>
      </View>

      {/* Capabilities */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Capabilities</Text>
        <View style={styles.capabilitiesList}>
          {capabilities.map((capability, index) => (
            <View key={index} style={styles.capabilityItem}>
              <Zap size={16} color="#00d4ff" strokeWidth={2} />
              <Text style={styles.capabilityText}>{capability}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Location Details */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Location Details</Text>
        
        <View style={styles.locationGrid}>
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Latitude</Text>
            <Text style={styles.locationValue}>
              {formatCoordinate(agent.latitude, 'lat')}
            </Text>
          </View>
          
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Longitude</Text>
            <Text style={styles.locationValue}>
              {formatCoordinate(agent.longitude, 'lng')}
            </Text>
          </View>
          
          {agent.altitude && (
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Altitude</Text>
              <Text style={styles.locationValue}>{agent.altitude.toFixed(1)}m</Text>
            </View>
          )}
          
          <View style={styles.locationItem}>
            <Text style={styles.locationLabel}>Visibility Range</Text>
            <Text style={styles.locationValue}>{agent.visibility_radius || 50}m</Text>
          </View>
        </View>
      </View>

      {/* Technical Details */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Technical Information</Text>
        
        <View style={styles.techDetails}>
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Agent ID</Text>
            <Text style={styles.techValue}>{agent.id}</Text>
          </View>
          
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Model Type</Text>
            <Text style={styles.techValue}>{agent.model_type || 'Default'}</Text>
          </View>
          
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Scale</Text>
            <Text style={styles.techValue}>
              {agent.scale_x || 1.0}×{agent.scale_y || 1.0}×{agent.scale_z || 1.0}
            </Text>
          </View>
          
          <View style={styles.techItem}>
            <Text style={styles.techLabel}>Status</Text>
            <Text style={[styles.techValue, { color: agent.is_active ? '#10b981' : '#ef4444' }]}>
              {agent.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Owner Information */}
      {agent.user_id && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Owner Information</Text>
          <View style={styles.ownerInfo}>
            <User size={20} color="#6b7280" strokeWidth={2} />
            <Text style={styles.ownerText}>Deployed by: {agent.user_id}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Star size={20} color="#374151" strokeWidth={2} />
          <Text style={styles.actionText}>Add to Favorites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Navigation size={20} color="#374151" strokeWidth={2} />
          <Text style={styles.actionText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  
  // Header
  headerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  agentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentEmoji: {
    fontSize: 32,
  },
  agentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  agentType: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  agentDescription: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Info Sections
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  typeDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  
  // Capabilities
  capabilitiesList: {
    gap: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capabilityText: {
    fontSize: 16,
    color: '#374151',
  },
  
  // Location
  locationGrid: {
    gap: 16,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  
  // Technical Details
  techDetails: {
    gap: 12,
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  techLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  techValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Owner
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerText: {
    fontSize: 16,
    color: '#374151',
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});