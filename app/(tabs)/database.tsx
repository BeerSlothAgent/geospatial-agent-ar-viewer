import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { 
  Database, 
  Eye, 
  MapPin, 
  Clock, 
  Cuboid as Cube, 
  RefreshCw, 
  CircleAlert as AlertCircle, 
  CircleCheck as CheckCircle, 
  Wifi, 
  WifiOff,
  X,
  Zap,
  Star,
  MessageCircle,
  Mic,
  Video,
  ExternalLink,
  Copy,
  Filter
} from 'lucide-react-native';
import { supabase, isSupabaseConfigured, debugSupabaseConfig } from '@/lib/supabase';
import { DeployedObject } from '@/types/database';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const [objects, setObjects] = useState<DeployedObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    totalObjects: number;
    lastQuery: string | null;
  }>({
    connected: false,
    totalObjects: 0,
    lastQuery: null,
  });
  const [selectedAgent, setSelectedAgent] = useState<DeployedObject | null>(null);
  const [showAgentCard, setShowAgentCard] = useState(false);
  const [retrievingCard, setRetrievingCard] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Testing database connection...');
      debugSupabaseConfig();

      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      // Test connection with a simple query
      const { data: testData, error: testError } = await supabase
        .from('deployed_objects')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('✅ Database connection successful');
      
      // Fetch all objects
      const { data, error } = await supabase
        .from('deployed_objects')
        .select(`
          id,
          name,
          description,
          latitude,
          longitude,
          altitude,
          object_type,
          user_id,
          model_url,
          model_type,
          scale_x,
          scale_y,
          scale_z,
          rotation_x,
          rotation_y,
          rotation_z,
          visibility_radius,
          is_active,
          created_at,
          updated_at,
          preciselatitude,
          preciselongitude,
          precisealtitude,
          accuracy,
          correctionapplied
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database query error:', error);
        throw new Error(`Query failed: ${error.message}`);
      }

      console.log('✅ Successfully fetched', data?.length || 0, 'objects');
      
      // Transform data to match our interface
      const transformedObjects: DeployedObject[] = (data || []).map(obj => ({
        id: obj.id,
        user_id: obj.user_id || 'unknown',
        object_type: obj.object_type || 'unknown',
        name: obj.name || 'Unnamed Object',
        description: obj.description || '',
        latitude: parseFloat(obj.latitude),
        longitude: parseFloat(obj.longitude),
        altitude: parseFloat(obj.altitude || 0),
        model_url: obj.model_url || '',
        model_type: obj.model_type || obj.object_type || 'sphere',
        scale_x: parseFloat(obj.scale_x || 1.0),
        scale_y: parseFloat(obj.scale_y || 1.0),
        scale_z: parseFloat(obj.scale_z || 1.0),
        rotation_x: parseFloat(obj.rotation_x || 0),
        rotation_y: parseFloat(obj.rotation_y || 0),
        rotation_z: parseFloat(obj.rotation_z || 0),
        is_active: obj.is_active !== false,
        visibility_radius: parseInt(obj.visibility_radius || 100),
        created_at: obj.created_at || new Date().toISOString(),
        updated_at: obj.updated_at || obj.created_at || new Date().toISOString(),
        preciselatitude: obj.preciselatitude ? parseFloat(obj.preciselatitude) : undefined,
        preciselongitude: obj.preciselongitude ? parseFloat(obj.preciselongitude) : undefined,
        precisealtitude: obj.precisealtitude ? parseFloat(obj.precisealtitude) : undefined,
        accuracy: obj.accuracy ? parseFloat(obj.accuracy) : undefined,
        correctionapplied: obj.correctionapplied || false,
      }));
      
      setObjects(transformedObjects);
      setConnectionStatus({
        connected: true,
        totalObjects: transformedObjects.length,
        lastQuery: new Date().toISOString(),
      });

      Alert.alert(
        'NEAR Network Connection Successful! 🎉',
        `Connected to NEAR network and found ${transformedObjects.length} NEAR agents in the database.`,
        [{ text: 'Great!' }]
      );
      
    } catch (err: any) {
      console.error('❌ Database error:', err);
      setError(err.message);
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        lastQuery: new Date().toISOString(),
      }));

      Alert.alert(
        'NEAR Network Connection Failed',
        err.message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const formatCoordinate = (coord: number | null | undefined): string => {
    if (coord === null || coord === undefined || isNaN(coord)) return 'N/A';
    return coord.toFixed(6);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleRetrieveCard = async (agent: DeployedObject) => {
    setRetrievingCard(true);
    setSelectedAgent(agent);
    
    // Simulate Filecoin retrieval
    setTimeout(() => {
      setRetrievingCard(false);
      setShowAgentCard(true);
    }, 2000);
  };

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setFilterActive(!!filter);
  };

  const filteredObjects = activeFilter 
    ? objects.filter(obj => obj.object_type === activeFilter)
    : objects;

  const getAgentTypeIcon = (type: string) => {
    switch(type) {
      case 'Intelligent Assistant':
        return '🤖';
      case 'Content Creator':
        return '🎨';
      case 'Local Services':
        return '🏪';
      case 'Tutor/Teacher':
        return '👨‍🏫';
      case '3D World Modelling':
        return '🌍';
      case 'Game Agent':
        return '🎮';
      case 'test-object':
        return '📦';
      case 'info-sphere':
        return '🔮';
      default:
        return '🤖';
    }
  };

  // Generate random IPFS hash and Filecoin CID
  const generateIPFSHash = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = 'Qm';
    for (let i = 0; i < 44; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  };

  const generateFilecoinCID = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let cid = 'bafy';
    for (let i = 0; i < 55; i++) {
      cid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return cid;
  };

  // Generate agent card data
  const generateAgentCardData = (agent: DeployedObject) => {
    const agentTypes: Record<string, any> = {
      'Intelligent Assistant': {
        specialization: 'General Intelligence & Problem Solving',
        experienceLevel: 'Expert',
        capabilities: [
          { icon: '🧠', name: 'Advanced Reasoning', description: 'Complex problem analysis and solution generation' },
          { icon: '📊', name: 'Data Analysis', description: 'Statistical analysis and insights generation' },
          { icon: '💡', name: 'Creative Solutions', description: 'Innovative approaches to challenges' },
          { icon: '🔍', name: 'Research Assistant', description: 'Comprehensive information gathering' }
        ]
      },
      'Content Creator': {
        specialization: 'Creative Content & Design',
        experienceLevel: 'Advanced',
        capabilities: [
          { icon: '🎨', name: 'Content Creation', description: 'High-quality creative content generation' },
          { icon: '📝', name: 'Copywriting', description: 'Engaging and persuasive text creation' },
          { icon: '🖼️', name: 'Visual Design', description: 'Aesthetic visual content suggestions' },
          { icon: '🎭', name: 'Storytelling', description: 'Compelling narrative development' }
        ]
      },
      'Local Services': {
        specialization: 'Local Information & Services',
        experienceLevel: 'Expert',
        capabilities: [
          { icon: '🗺️', name: 'Local Navigation', description: 'Area-specific directions and routes' },
          { icon: '🍕', name: 'Restaurant Finder', description: 'Local dining recommendations' },
          { icon: '🛍️', name: 'Shopping Guide', description: 'Local business directory' },
          { icon: '🎪', name: 'Event Updates', description: 'Community events and activities' }
        ]
      },
      'Tutor/Teacher': {
        specialization: 'Educational Support & Learning',
        experienceLevel: 'Advanced',
        capabilities: [
          { icon: '📚', name: 'Study Planning', description: 'Personalized learning schedules' },
          { icon: '✏️', name: 'Homework Help', description: 'Step-by-step problem solving' },
          { icon: '🎯', name: 'Goal Setting', description: 'Academic milestone tracking' },
          { icon: '🧪', name: 'Subject Expertise', description: 'Multi-disciplinary knowledge' }
        ]
      }
    };

    const typeData = agentTypes[agent.object_type] || agentTypes['Intelligent Assistant'];

    return {
      ...typeData,
      languages: ['English', 'Spanish', 'French'],
      totalRevenue: Math.floor(Math.random() * 500 + 100),
      revenueGrowth: Math.floor(Math.random() * 30 + 5),
      transactionVolume: Math.floor(Math.random() * 1000 + 200),
      volumeGrowth: Math.floor(Math.random() * 25 + 3),
      rating: (4.2 + Math.random() * 0.8).toFixed(1),
      totalReviews: Math.floor(Math.random() * 150 + 50),
      responseTime: (Math.random() * 2 + 0.5).toFixed(1),
      pricing: {
        text: Math.floor(Math.random() * 5 + 3),
        voice: Math.floor(Math.random() * 10 + 8),
        video: Math.floor(Math.random() * 15 + 12)
      },
      ipfsHash: generateIPFSHash(),
      filecoinCID: generateFilecoinCID(),
      lastUpdated: new Date().toLocaleDateString()
    };
  };

  return (
    <View style={styles.container}>
      {/* Marketplace Header */}
      <View style={styles.marketplaceHeader}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.marketplaceTitle}>🛒 NEAR Agents Marketplace</Text>
            <Text style={styles.marketplaceSubtitle}>
              Discover and interact with NEAR-powered agents stored on Filecoin
            </Text>
          </View>
          
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{connectionStatus.totalObjects.toString()}</Text>
              <Text style={styles.statLabel}>Active Agents</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12.5k</Text>
              <Text style={styles.statLabel}>Total Interactions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>850</Text>
              <Text style={styles.statLabel}>USDFC Volume</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.marketplaceStatus}>
          <View style={styles.statusIndicator}>
            {connectionStatus.connected ? (
              <CheckCircle size={16} color="#00EC97" strokeWidth={2} />
            ) : (
              <AlertCircle size={16} color="#ff6b35" strokeWidth={2} />
            )}
            <Text style={[styles.statusText, { color: connectionStatus.connected ? '#00EC97' : '#ff6b35' }]}>
              {connectionStatus.connected ? 'Connected to NEAR Protocol' : 'NEAR Connection Failed'}
            </Text>
          </View>
          
          <View style={styles.statusIndicator}>
            <CheckCircle size={16} color="#00EC97" strokeWidth={2} />
            <Text style={[styles.statusText, { color: '#00EC97' }]}>
              Filecoin Storage Active
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filter NEAR Agents</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterActive(false)}
            disabled={!filterActive}
          >
            <Text style={[styles.filterButtonText, !filterActive && styles.filterButtonDisabled]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              activeFilter === 'Intelligent Assistant' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(activeFilter === 'Intelligent Assistant' ? null : 'Intelligent Assistant')}
          >
            <Text style={styles.filterChipIcon}>🤖</Text>
            <Text style={[
              styles.filterChipText,
              activeFilter === 'Intelligent Assistant' && styles.filterChipTextActive
            ]}>
              Intelligent Assistant
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              activeFilter === 'Content Creator' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(activeFilter === 'Content Creator' ? null : 'Content Creator')}
          >
            <Text style={styles.filterChipIcon}>🎨</Text>
            <Text style={[
              styles.filterChipText,
              activeFilter === 'Content Creator' && styles.filterChipTextActive
            ]}>
              Content Creator
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              activeFilter === 'Local Services' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(activeFilter === 'Local Services' ? null : 'Local Services')}
          >
            <Text style={styles.filterChipIcon}>🏪</Text>
            <Text style={[
              styles.filterChipText,
              activeFilter === 'Local Services' && styles.filterChipTextActive
            ]}>
              Local Services
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              activeFilter === 'Tutor/Teacher' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(activeFilter === 'Tutor/Teacher' ? null : 'Tutor/Teacher')}
          >
            <Text style={styles.filterChipIcon}>👨‍🏫</Text>
            <Text style={[
              styles.filterChipText,
              activeFilter === 'Tutor/Teacher' && styles.filterChipTextActive
            ]}>
              Tutor/Teacher
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              activeFilter === 'Game Agent' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange(activeFilter === 'Game Agent' ? null : 'Game Agent')}
          >
            <Text style={styles.filterChipIcon}>🎮</Text>
            <Text style={[
              styles.filterChipText,
              activeFilter === 'Game Agent' && styles.filterChipTextActive
            ]}>
              Game Agent
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorSection}>
          <AlertCircle size={16} color="#ff6b35" strokeWidth={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Objects List */}
      <ScrollView 
        style={styles.objectsList}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={testConnection}
            tintColor="#00EC97"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && filteredObjects.length === 0 && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={32} color="#00EC97" />
            <Text style={styles.loadingText}>Loading NEAR agents...</Text>
          </View>
        )}

        {!loading && filteredObjects.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Cube size={48} color="#00EC97" strokeWidth={2} />
            <Text style={styles.emptyTitle}>No NEAR Agents Found</Text>
            <Text style={styles.emptyMessage}>
              No NEAR agents are currently available in the marketplace. Check back later or try a different filter.
            </Text>
          </View>
        )}

        {filteredObjects.map((obj, index) => (
          <MarketplaceAgentCard
            key={obj.id || index}
            agent={obj}
            isActive={index < 3} // First 3 agents are fully interactive
            index={index}
            onRetrieveCard={handleRetrieveCard}
          />
        ))}
      </ScrollView>

      {/* Agent Card Modal */}
      <Modal
        visible={showAgentCard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAgentCard(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.agentCardModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>{selectedAgent?.name}</Text>
                <Text style={styles.modalSubtitle}>NEAR Agent Card - Retrieved from Filecoin/IPFS</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAgentCard(false)}
              >
                <X size={20} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selectedAgent && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Agent Overview */}
                <View style={styles.cardSection}>
                  <Text style={styles.sectionTitle}>🤖 Agent Overview</Text>
                  <View style={styles.overviewGrid}>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Type:</Text>
                      <Text style={styles.overviewValue}>NEAR {selectedAgent.object_type}</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Specialization:</Text>
                      <Text style={styles.overviewValue}>
                        {selectedAgent.object_type === 'Intelligent Assistant' ? 'General Intelligence & Problem Solving' :
                         selectedAgent.object_type === 'Content Creator' ? 'Creative Content & Design' :
                         selectedAgent.object_type === 'Local Services' ? 'Local Information & Services' :
                         selectedAgent.object_type === 'Tutor/Teacher' ? 'Educational Support & Learning' :
                         'Advanced AI Capabilities'}
                      </Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Experience Level:</Text>
                      <Text style={styles.overviewValue}>Expert</Text>
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Languages:</Text>
                      <Text style={styles.overviewValue}>English, Spanish, French</Text>
                    </View>
                  </View>
                </View>

                {/* Capabilities */}
                <View style={styles.cardSection}>
                  <Text style={styles.sectionTitle}>⚡ Capabilities & Features</Text>
                  <View style={styles.capabilitiesGrid}>
                    {generateAgentCardData(selectedAgent).capabilities.map((capability, index) => (
                      <View key={index} style={styles.capabilityItem}>
                        <Text style={styles.capabilityIcon}>{capability.icon}</Text>
                        <View style={styles.capabilityInfo}>
                          <Text style={styles.capabilityName}>{capability.name}</Text>
                          <Text style={styles.capabilityDesc}>{capability.description}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Performance Metrics */}
                <View style={styles.cardSection}>
                  <Text style={styles.sectionTitle}>📊 Performance & Analytics</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Text style={styles.metricIcon}>💰</Text>
                        <Text style={styles.metricTitle}>Total Revenue</Text>
                      </View>
                      <Text style={styles.metricValue}>
                        {Math.floor(Math.random() * 500 + 100)} USDFC
                      </Text>
                      <Text style={styles.metricChange}>
                        +{Math.floor(Math.random() * 30 + 5)}% this month
                      </Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Text style={styles.metricIcon}>🔄</Text>
                        <Text style={styles.metricTitle}>Transaction Volume</Text>
                      </View>
                      <Text style={styles.metricValue}>
                        {Math.floor(Math.random() * 1000 + 200)}
                      </Text>
                      <Text style={styles.metricChange}>
                        +{Math.floor(Math.random() * 25 + 3)}% this week
                      </Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Text style={styles.metricIcon}>⭐</Text>
                        <Text style={styles.metricTitle}>User Rating</Text>
                      </View>
                      <Text style={styles.metricValue}>
                        {(4.2 + Math.random() * 0.8).toFixed(1)}/5.0
                      </Text>
                      <Text style={styles.metricChange}>
                        {Math.floor(Math.random() * 150 + 50)} reviews
                      </Text>
                    </View>
                    
                    <View style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Text style={styles.metricIcon}>⚡</Text>
                        <Text style={styles.metricTitle}>Response Time</Text>
                      </View>
                      <Text style={styles.metricValue}>
                        {(Math.random() * 2 + 0.5).toFixed(1)}s
                      </Text>
                      <Text style={styles.metricChange}>
                        Average response
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Pricing */}
                <View style={styles.cardSection}>
                  <Text style={styles.sectionTitle}>💳 Interaction Pricing</Text>
                  <View style={styles.pricingGrid}>
                    <View style={styles.pricingItem}>
                      <View style={styles.pricingType}>
                        <Text style={styles.pricingIcon}>💬</Text>
                        <Text style={styles.pricingName}>Text Chat</Text>
                      </View>
                      <Text style={styles.pricingCost}>
                        {Math.floor(Math.random() * 5 + 3)} USDFC
                      </Text>
                      <TouchableOpacity style={styles.pricingBtn}>
                        <Text style={styles.pricingBtnText}>Chat Now</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.pricingItem}>
                      <View style={styles.pricingType}>
                        <Text style={styles.pricingIcon}>🔊</Text>
                        <Text style={styles.pricingName}>Voice Call</Text>
                      </View>
                      <Text style={styles.pricingCost}>
                        {Math.floor(Math.random() * 10 + 8)} USDFC
                      </Text>
                      <TouchableOpacity style={styles.pricingBtn}>
                        <Text style={styles.pricingBtnText}>Call Now</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.pricingItem}>
                      <View style={styles.pricingType}>
                        <Text style={styles.pricingIcon}>📹</Text>
                        <Text style={styles.pricingName}>Video Call</Text>
                      </View>
                      <Text style={styles.pricingCost}>
                        {Math.floor(Math.random() * 15 + 12)} USDFC
                      </Text>
                      <TouchableOpacity style={styles.pricingBtn}>
                        <Text style={styles.pricingBtnText}>Video Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Storage Info */}
                <View style={styles.cardSection}>
                  <Text style={styles.sectionTitle}>📁 Decentralized Storage</Text>
                  <View style={styles.storageInfo}>
                    <View style={styles.storageItem}>
                      <Text style={styles.storageLabel}>IPFS Hash:</Text>
                      <Text style={styles.storageValue}>{generateIPFSHash()}</Text>
                      <TouchableOpacity style={styles.copyBtn}>
                        <Copy size={16} color="#00EC97" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.storageItem}>
                      <Text style={styles.storageLabel}>Filecoin CID:</Text>
                      <Text style={styles.storageValue}>{generateFilecoinCID()}</Text>
                      <TouchableOpacity style={styles.copyBtn}>
                        <Copy size={16} color="#00EC97" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.storageItem}>
                      <Text style={styles.storageLabel}>Last Updated:</Text>
                      <Text style={styles.storageValue}>{new Date().toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <View style={styles.footerInfo}>
                <Text style={styles.footerInfoText}>
                  Agent card retrieved from Filecoin/IPFS • Powered by NEAR Protocol
                </Text>
              </View>
              <View style={styles.footerActions}>
                <TouchableOpacity 
                  style={styles.btnSecondary}
                  onPress={() => setShowAgentCard(false)}
                >
                  <Text style={styles.btnSecondaryText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>Interact with Agent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal for Filecoin Retrieval */}
      <Modal
        visible={retrievingCard}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModal}>
            <LoadingSpinner size={48} color="#00EC97" />
            <Text style={styles.loadingModalTitle}>Retrieving from Filecoin</Text>
            <Text style={styles.loadingModalText}>
              Fetching agent card data from decentralized storage...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Marketplace Agent Card Component
function MarketplaceAgentCard({ 
  agent, 
  isActive,
  index,
  onRetrieveCard
}: { 
  agent: DeployedObject;
  isActive: boolean;
  index: number;
  onRetrieveCard: (agent: DeployedObject) => void;
}) {
  const getAgentIcon = (type: string) => {
    switch(type) {
      case 'Intelligent Assistant':
        return '🤖';
      case 'Content Creator':
        return '🎨';
      case 'Local Services':
        return '🏪';
      case 'Tutor/Teacher':
        return '👨‍🏫';
      case '3D World Modelling':
        return '🌍';
      case 'Game Agent':
        return '🎮';
      case 'test-object':
        return '📦';
      case 'info-sphere':
        return '🔮';
      default:
        return '🤖';
    }
  };

  const getRandomLocation = () => {
    const cities = ['San Francisco', 'New York', 'Tokyo', 'London', 'Berlin', 'Paris', 'Sydney'];
    return cities[Math.floor(Math.random() * cities.length)];
  };

  return (
    <View style={styles.marketplaceAgentCard}>
      <View style={styles.agentHeader}>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentEmoji}>{getAgentIcon(agent.object_type)}</Text>
          </View>
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentType}>NEAR {agent.object_type}</Text>
            <Text style={styles.agentId}>ID: {agent.id.substring(0, 8)}...</Text>
          </View>
        </View>
        <View style={styles.agentStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: agent.is_active ? 'rgba(0, 236, 151, 0.2)' : 'rgba(255, 107, 53, 0.2)' }
          ]}>
            <Text style={[
              styles.statusBadgeText,
              { color: agent.is_active ? '#00EC97' : '#ff6b35' }
            ]}>
              {agent.is_active ? '🟢 Active' : '🔴 Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.agentMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Location:</Text>
          <Text style={styles.metricValue}>{getRandomLocation()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Range:</Text>
          <Text style={styles.metricValue}>{agent.visibility_radius?.toString() || '0'}m</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Created:</Text>
          <Text style={styles.metricValue}>
            {new Date(agent.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {isActive && (
        <TouchableOpacity 
          style={styles.retrieveCardBtn}
          onPress={() => onRetrieveCard(agent)}
        >
          <Text style={styles.filecoinIcon}>📁</Text>
          <Text style={styles.retrieveCardText}>Retrieve Agent's Card from Filecoin</Text>
        </TouchableOpacity>
      )}

      {!isActive && (
        <View style={styles.inactiveNotice}>
          <Text style={styles.inactiveText}>💤 Agent card retrieval coming soon</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
    paddingTop: 60,
  },
  
  // Marketplace Header
  marketplaceHeader: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00EC97',
  },
  headerContent: {
    marginBottom: 15,
  },
  titleSection: {
    marginBottom: 15,
  },
  marketplaceTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00EC97',
    marginBottom: 5,
  },
  marketplaceSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00EC97',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  marketplaceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Filter Section
  filterSection: {
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#00EC97',
  },
  filterButtonDisabled: {
    opacity: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipActive: {
    borderColor: '#00EC97',
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
  },
  filterChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#fff',
  },
  filterChipTextActive: {
    color: '#00EC97',
    fontWeight: '600',
  },
  
  // Error Section
  errorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b3520',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b35',
    flex: 1,
  },
  
  // Objects List
  objectsList: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  
  // Marketplace Agent Card
  marketplaceAgentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 236, 151, 0.2)',
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentEmoji: {
    fontSize: 24,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  agentType: {
    fontSize: 14,
    color: '#00EC97',
    marginBottom: 2,
  },
  agentId: {
    fontSize: 12,
    color: '#aaa',
  },
  agentStatus: {
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  agentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  retrieveCardBtn: {
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    borderWidth: 1,
    borderColor: '#00EC97',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  filecoinIcon: {
    fontSize: 16,
  },
  retrieveCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00EC97',
  },
  inactiveNotice: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inactiveText: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  agentCardModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: '#00EC97',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 236, 151, 0.2)',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#aaa',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    maxHeight: '70%',
  },
  cardSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#00EC97',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  overviewGrid: {
    gap: 12,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#aaa',
    flex: 1,
  },
  overviewValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 2,
  },
  capabilitiesGrid: {
    gap: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  capabilityIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  capabilityInfo: {
    flex: 1,
  },
  capabilityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  capabilityDesc: {
    fontSize: 12,
    color: '#aaa',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    width: width > 600 ? '48%' : '100%',
    marginBottom: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  metricIcon: {
    fontSize: 16,
  },
  metricTitle: {
    fontSize: 14,
    color: '#aaa',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00EC97',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    color: '#aaa',
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pricingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    width: width > 600 ? '31%' : '100%',
    marginBottom: 10,
  },
  pricingType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  pricingIcon: {
    fontSize: 16,
  },
  pricingName: {
    fontSize: 14,
    color: '#fff',
  },
  pricingCost: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00EC97',
    marginBottom: 10,
  },
  pricingBtn: {
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00EC97',
  },
  pricingBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00EC97',
  },
  storageInfo: {
    gap: 10,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
  },
  storageLabel: {
    fontSize: 14,
    color: '#aaa',
    width: 100,
  },
  storageValue: {
    fontSize: 12,
    color: '#0066FF',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 236, 151, 0.2)',
  },
  footerInfo: {
    marginBottom: 15,
  },
  footerInfoText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: '#00EC97',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  
  // Loading Modal
  loadingModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00EC97',
    width: '80%',
  },
  loadingModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00EC97',
    marginTop: 20,
    marginBottom: 10,
  },
  loadingModalText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});