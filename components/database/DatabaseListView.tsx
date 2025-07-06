import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Database, Eye, MapPin, Clock, Cuboid as Cube, RefreshCw, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase, isSupabaseConfigured, debugSupabaseConfig } from '@/lib/supabase';
import { DeployedObject } from '@/types/database';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DatabaseListView() {
  const [objects, setObjects] = useState<DeployedObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    totalObjects: number;
    lastQuery: string | null;
  }>({
    connected: false,
    totalObjects: 0,
    lastQuery: null,
  });

  const fetchAllObjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching all objects from database...');
      debugSupabaseConfig();

      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from('deployed_objects')
        .select('count', { count: 'exact', head: true });

      if (testError) {
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('✅ Database connection successful');
      
      // Fetch all objects with ONLY existing columns (no updated_at)
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
      console.log('📋 Raw data:', data);
      
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
        // Use created_at as updated_at since updated_at column doesn't exist
        updated_at: obj.created_at || new Date().toISOString(),
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
      
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        lastQuery: new Date().toISOString(),
      }));
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('🧪 Testing database connection...');
      
      if (!isSupabaseConfigured) {
        console.log('⚠️ Supabase not configured');
        return;
      }

      if (!supabase) {
        console.log('⚠️ Supabase client not initialized');
        return;
      }

      // Test basic connectivity
      const { data, error } = await supabase
        .from('deployed_objects')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Connection test failed:', error);
      } else {
        console.log('✅ Connection test successful');
      }

      // Test table structure
      const { data: sampleData } = await supabase
        .from('deployed_objects')
        .select('*')
        .limit(1);

      if (sampleData?.[0]) {
        console.log('📋 Available columns:', Object.keys(sampleData[0]));
      }

    } catch (error) {
      console.error('❌ Connection test error:', error);
    }
  };

  useEffect(() => {
    testDatabaseConnection();
    fetchAllObjects();
  }, []);

  const formatCoordinate = (coord: number | null | undefined): string => {
    if (coord === null || coord === undefined || isNaN(coord)) return 'N/A';
    return coord.toFixed(6);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Database size={24} color="#00d4ff" strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.title}>Database Objects</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Loading...' : `${objects.length} objects found`}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={fetchAllObjects}
            disabled={loading}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color="#00d4ff" strokeWidth={2} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowDetails(!showDetails)}
            activeOpacity={0.7}
          >
            <Eye size={16} color="#00d4ff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status */}
      <View style={styles.statusSection}>
        <View style={styles.statusHeader}>
          {connectionStatus.connected ? (
            <CheckCircle size={16} color="#00ff88" strokeWidth={2} />
          ) : (
            <AlertCircle size={16} color="#ff6b35" strokeWidth={2} />
          )}
          <Text style={[
            styles.statusText,
            { color: connectionStatus.connected ? '#00ff88' : '#ff6b35' }
          ]}>
            {connectionStatus.connected ? 'Database Connected' : 'Database Disconnected'}
          </Text>
        </View>
        
        <View style={styles.statusDetails}>
          <Text style={styles.statusDetail}>
            Configuration: {isSupabaseConfigured ? 'Valid' : 'Missing'}
          </Text>
          <Text style={styles.statusDetail}>
            Total Objects: {connectionStatus.totalObjects}
          </Text>
          {connectionStatus.lastQuery && (
            <Text style={styles.statusDetail}>
              Last Query: {formatDate(connectionStatus.lastQuery)}
            </Text>
          )}
          <Text style={styles.statusDetail}>
            Query Method: Direct Table Query (No updated_at column)
          </Text>
        </View>
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
            onRefresh={fetchAllObjects}
            tintColor="#00d4ff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && objects.length === 0 && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={32} />
            <Text style={styles.loadingText}>Loading objects...</Text>
          </View>
        )}

        {!loading && objects.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Cube size={48} color="#666" strokeWidth={2} />
            <Text style={styles.emptyTitle}>No Objects Found</Text>
            <Text style={styles.emptyMessage}>
              No AR objects are currently deployed in the database. Deploy some objects from the main application to see them here.
            </Text>
          </View>
        )}

        {objects.map((obj, index) => (
          <ObjectItem
            key={obj.id || index}
            object={obj}
            showDetails={showDetails}
          />
        ))}
      </ScrollView>

      {/* Debug Info */}
      {objects.length > 0 && (
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <Text style={styles.debugText}>• Supabase URL: {isSupabaseConfigured ? 'Configured' : 'Missing'}</Text>
          <Text style={styles.debugText}>• Database Client: {supabase ? 'Initialized' : 'Not Initialized'}</Text>
          <Text style={styles.debugText}>• Query Method: Direct Table Query (RPC Disabled)</Text>
          <Text style={styles.debugText}>• Objects Retrieved: {objects.length}</Text>
          <Text style={styles.debugText}>• Active Objects: {objects.filter(obj => obj.is_active).length}</Text>
          <Text style={styles.debugText}>• Column Issue: updated_at column removed from query</Text>
        </View>
      )}
    </View>
  );
}

// Individual object item component
function ObjectItem({ 
  object, 
  showDetails 
}: { 
  object: DeployedObject; 
  showDetails: boolean;
}) {
  const formatCoordinate = (coord: number): string => {
    if (coord === null || coord === undefined || isNaN(coord)) return 'N/A';
    return coord.toFixed(6);
  };

  const formatScale = (x: number, y: number, z: number): string => {
    const formatValue = (val: number) => {
      if (val === null || val === undefined || isNaN(val)) return '1';
      return val.toString();
    };
    return `${formatValue(x)}×${formatValue(y)}×${formatValue(z)}`;
  };

  return (
    <View style={styles.objectItem}>
      {/* Basic Info */}
      <View style={styles.objectHeader}>
        <View style={styles.objectIcon}>
          <Cube size={20} color="#00d4ff" strokeWidth={2} />
        </View>
        <View style={styles.objectInfo}>
          <Text style={styles.objectName}>{object.name}</Text>
          <Text style={styles.objectId}>ID: {object.id}</Text>
          {object.description && (
            <Text style={styles.objectDescription} numberOfLines={2}>
              {object.description}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: object.is_active ? '#00ff8820' : '#ff6b3520' }
        ]}>
          <Text style={[
            styles.statusBadgeText,
            { color: object.is_active ? '#00ff88' : '#ff6b35' }
          ]}>
            {object.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Location Info */}
      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <MapPin size={12} color="#aaa" strokeWidth={2} />
          <Text style={styles.locationText}>
            {formatCoordinate(object.latitude)}, {formatCoordinate(object.longitude)}
          </Text>
        </View>
        {object.altitude !== 0 && (
          <Text style={styles.altitudeText}>
            Altitude: {object.altitude.toFixed(1)}m
          </Text>
        )}
      </View>

      {/* 3D Properties */}
      <View style={styles.propertiesSection}>
        <View style={styles.propertyRow}>
          <Text style={styles.propertyLabel}>Model:</Text>
          <Text style={styles.propertyValue}>{object.model_type?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>
        <View style={styles.propertyRow}>
          <Text style={styles.propertyLabel}>Scale:</Text>
          <Text style={styles.propertyValue}>
            {formatScale(object.scale_x || 1, object.scale_y || 1, object.scale_z || 1)}
          </Text>
        </View>
        <View style={styles.propertyRow}>
          <Text style={styles.propertyLabel}>Visibility:</Text>
          <Text style={styles.propertyValue}>{object.visibility_radius}m</Text>
        </View>
      </View>

      {/* Detailed Info (Collapsible) */}
      {showDetails && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>All Properties</Text>
          <View style={styles.detailsGrid}>
            {Object.entries(object).map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.detailKey}>{key}:</Text>
                <Text style={styles.detailValue}>
                  {value === null || value === undefined 
                    ? 'null' 
                    : typeof value === 'object' 
                      ? JSON.stringify(value) 
                      : String(value)
                  }
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Timestamps */}
      <View style={styles.timestampSection}>
        <View style={styles.timestampRow}>
          <Clock size={10} color="#666" strokeWidth={2} />
          <Text style={styles.timestampText}>
            Created: {new Date(object.created_at || '').toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Status Section
  statusSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDetails: {
    gap: 4,
  },
  statusDetail: {
    fontSize: 12,
    color: '#aaa',
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
  
  // Object Item
  objectItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  objectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  objectIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  objectInfo: {
    flex: 1,
  },
  objectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  objectId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  objectDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Location Section
  locationSection: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'monospace',
  },
  altitudeText: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 18,
  },
  
  // Properties Section
  propertiesSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  propertyRow: {
    flex: 1,
  },
  propertyLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  propertyValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Details Section
  detailsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 8,
  },
  detailsGrid: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailKey: {
    fontSize: 10,
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 10,
    color: '#aaa',
    flex: 1,
  },
  
  // Timestamp Section
  timestampSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: 10,
    color: '#666',
  },
  
  // Debug Section
  debugSection: {
    backgroundColor: '#00d4ff20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#00d4ff',
    lineHeight: 16,
  },
});