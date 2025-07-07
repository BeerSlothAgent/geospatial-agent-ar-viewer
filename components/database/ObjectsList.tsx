import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Cuboid as Cube, MapPin, Eye, Clock, ArrowRight } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ObjectsListProps {
  objects: DeployedObject[];
  isLoading: boolean;
  error?: string | null;
  onObjectSelect?: (object: DeployedObject) => void;
  onRefresh?: () => void;
  compact?: boolean;
}

export default function ObjectsList({
  objects,
  isLoading,
  error,
  onObjectSelect,
  onRefresh,
  compact = false,
}: ObjectsListProps) {

  const formatDistance = (distance?: number): string => {
    if (!distance) return 'Unknown';
    if (distance < 1) return `${(distance * 100).toFixed(0)}cm`;
    if (distance < 1000) return `${distance.toFixed(1)}m`;
    return `${(distance / 1000).toFixed(2)}km`;
  };

  const getModelTypeIcon = (modelType: string) => {
    return <Cube size={16} color="#00d4ff" strokeWidth={2} />;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Cube size={16} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.compactTitle}>AR Objects</Text>
          {isLoading && <LoadingSpinner size={16} />}
        </View>
        
        {error ? (
          <Text style={styles.compactError}>{error}</Text>
        ) : (
          <Text style={styles.compactCount}>
            {objects.length} object{objects.length !== 1 ? 's' : ''} nearby
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Cube size={24} color="#00EC97" strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.title}>NEAR AR Objects</Text>
            <Text style={styles.subtitle}>
              {isLoading ? 'Loading...' : `${objects.length} NEAR objects nearby`}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {isLoading && <LoadingSpinner size={20} />}
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>{error}</Text>
          {onRefresh && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Objects List */}
      {!error && (
        <ScrollView 
          style={styles.objectsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {objects.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Cube size={48} color="#666" strokeWidth={2} />
              <Text style={styles.emptyTitle}>No AR Objects Found</Text>
              <Text style={styles.emptyMessage}>
                No AR objects are currently deployed in your area. Try moving to a different location or check back later.
              </Text>
            </View>
          ) : (
            objects.map((object) => (
              <ObjectItem
                key={object.id}
                object={object}
                onSelect={onObjectSelect}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Info */}
      {objects.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            NEAR objects are loaded based on your current location and visibility radius.
          </Text>
        </View>
      )}
    </View>
  );
}

// Individual object item component
function ObjectItem({ 
  object, 
  onSelect 
}: { 
  object: DeployedObject; 
  onSelect?: (object: DeployedObject) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.objectItem}
      onPress={() => onSelect?.(object)}
      activeOpacity={0.7}
    >
      <View style={styles.objectHeader}>
        <View style={styles.objectIcon}>
          <Cube size={20} color="#00d4ff" strokeWidth={2} />
        </View>
        <View style={styles.objectInfo}>
          <Text style={styles.objectName}>{object.name}</Text>
          {object.description && (
            <Text style={styles.objectDescription} numberOfLines={1}>
              {object.description}
            </Text>
          )}
        </View>
        <ArrowRight size={16} color="#666" strokeWidth={2} />
      </View>

      <View style={styles.objectDetails}>
        <View style={styles.objectDetail}>
          <MapPin size={12} color="#aaa" strokeWidth={2} />
          <Text style={styles.objectDetailText}>
            {formatDistance(object.distance_meters)}
          </Text>
        </View>
        
        <View style={styles.objectDetail}>
          <Eye size={12} color="#aaa" strokeWidth={2} />
          <Text style={styles.objectDetailText}>
            {object.visibility_radius}m range
          </Text>
        </View>
        
        <View style={styles.objectDetail}>
          <Clock size={12} color="#aaa" strokeWidth={2} />
          <Text style={styles.objectDetailText}>
            {new Date(object.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.objectMeta}>
        <View style={styles.modelType}>
          <Text style={styles.modelTypeText}>{object.model_type.toUpperCase()}</Text>
        </View>
        
        {object.distance_meters && object.distance_meters < 10 && (
          <View style={styles.nearbyBadge}>
            <Text style={styles.nearbyBadgeText}>Nearby</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  compactCount: {
    fontSize: 12,
    color: '#aaa',
  },
  compactError: {
    fontSize: 12,
    color: '#ff6b35',
  },

  // Full styles
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 400,
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // Error section
  errorSection: {
    backgroundColor: '#ff6b3520',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b35',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Objects list
  objectsList: {
    flex: 1,
    marginBottom: 16,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
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
    maxWidth: 280,
  },
  
  // Object item
  objectItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  objectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  objectDescription: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // Object details
  objectDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  objectDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  objectDetailText: {
    fontSize: 12,
    color: '#aaa',
  },
  
  // Object meta
  objectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelType: {
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modelTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00EC97',
  },
  nearbyBadge: {
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  nearbyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00EC97',
  },
  
  // Info
  infoSection: {
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#00EC97',
    lineHeight: 16,
    textAlign: 'center',
  },
});