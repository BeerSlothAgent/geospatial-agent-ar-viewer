import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Navigation, RefreshCw, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { LocationData, LocationError } from '@/hooks/useLocation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface LocationDisplayProps {
  location: LocationData | null;
  error: LocationError | null;
  isLoading: boolean;
  hasPermission: boolean;
  isWatching: boolean;
  onRefresh?: () => void;
  onRequestPermission?: () => void;
  onToggleWatching?: () => void;
  compact?: boolean;
}

export default function LocationDisplay({
  location,
  error,
  isLoading,
  hasPermission,
  isWatching,
  onRefresh,
  onRequestPermission,
  onToggleWatching,
  compact = false,
}: LocationDisplayProps) {
  
  const formatCoordinate = (value: number, type: 'lat' | 'lng'): string => {
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  const formatAccuracy = (accuracy?: number): string => {
    if (!accuracy) return 'Unknown';
    if (accuracy < 5) return 'Excellent';
    if (accuracy < 10) return 'Good';
    if (accuracy < 20) return 'Fair';
    return 'Poor';
  };

  const getAccuracyColor = (accuracy?: number): string => {
    if (!accuracy) return '#666';
    if (accuracy < 5) return '#00ff88';
    if (accuracy < 10) return '#00d4ff';
    if (accuracy < 20) return '#ff9500';
    return '#ff6b35';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <MapPin size={16} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.compactTitle}>Location</Text>
          {isLoading && <LoadingSpinner size={16} />}
        </View>
        
        {error ? (
          <Text style={styles.compactError}>{error.message}</Text>
        ) : location ? (
          <Text style={styles.compactCoords}>
            {formatCoordinate(location.latitude, 'lat')}, {formatCoordinate(location.longitude, 'lng')}
          </Text>
        ) : (
          <Text style={styles.compactStatus}>No location data</Text>
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
            <MapPin size={24} color="#00EC97" strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.title}>NEAR Location Services</Text>
            <Text style={styles.subtitle}>
              {hasPermission ? 'Permissions granted' : 'Permissions required'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {isLoading && <LoadingSpinner size={20} />}
          {hasPermission && (
            <View style={[
              styles.statusDot, 
              { backgroundColor: location ? '#00ff88' : '#ff6b35' }
            ]} />
          )}
        </View>
      </View>

      {/* Permission Request */}
      {!hasPermission && (
        <View style={styles.permissionSection}>
          <AlertCircle size={20} color="#ff6b35" strokeWidth={2} />
          <Text style={styles.permissionText}>
            Location access is required for AR functionality
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={onRequestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorSection}>
          <AlertCircle size={20} color="#ff6b35" strokeWidth={2} />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Location Error</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </View>
        </View>
      )}

      {/* Location Data */}
      {location && (
        <View style={styles.locationSection}>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateItem}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <Text style={styles.coordinateValue}>
                {formatCoordinate(location.latitude, 'lat')}
              </Text>
            </View>
            
            <View style={styles.coordinateItem}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <Text style={styles.coordinateValue}>
                {formatCoordinate(location.longitude, 'lng')}
              </Text>
            </View>
          </View>

          {location.altitude && (
            <View style={styles.altitudeRow}>
              <Text style={styles.coordinateLabel}>Altitude</Text>
              <Text style={styles.coordinateValue}>
                {location.altitude.toFixed(1)} m
              </Text>
            </View>
          )}

          {location.accuracy && (
            <View style={styles.accuracyRow}>
              <Text style={styles.coordinateLabel}>Accuracy</Text>
              <View style={styles.accuracyContainer}>
                <Text style={[
                  styles.accuracyValue,
                  { color: getAccuracyColor(location.accuracy) }
                ]}>
                  {formatAccuracy(location.accuracy)}
                </Text>
                <Text style={styles.accuracyMeters}>
                  (±{location.accuracy.toFixed(1)}m)
                </Text>
              </View>
            </View>
          )}

          <View style={styles.timestampRow}>
            <Text style={styles.coordinateLabel}>Last Updated</Text>
            <Text style={styles.coordinateValue}>
              {new Date(location.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      {/* Controls */}
      {hasPermission && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onRefresh}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <RefreshCw size={16} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.controlButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton,
              isWatching && styles.controlButtonActive
            ]}
            onPress={onToggleWatching}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Navigation size={16} color={isWatching ? "#000" : "#00d4ff"} strokeWidth={2} />
            <Text style={[
              styles.controlButtonText,
              isWatching && styles.controlButtonTextActive
            ]}>
              {isWatching ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  compactCoords: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'monospace',
  },
  compactError: {
    fontSize: 12,
    color: '#ff6b35',
  },
  compactStatus: {
    fontSize: 12,
    color: '#666',
  },

  // Full styles
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
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
    gap: 12,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Permission section
  permissionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b3520',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    color: '#ff6b35',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Error section
  errorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ff6b3520',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#ff6b35',
    lineHeight: 20,
  },
  
  // Location section
  locationSection: {
    gap: 16,
    marginBottom: 20,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coordinateItem: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
  },
  altitudeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accuracyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accuracyValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  accuracyMeters: {
    fontSize: 14,
    color: '#aaa',
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  controlButtonActive: {
    backgroundColor: '#00d4ff',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00EC97',
  },
  controlButtonTextActive: {
    color: '#000',
  },
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