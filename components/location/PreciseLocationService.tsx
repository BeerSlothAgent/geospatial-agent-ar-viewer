import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Satellite, Zap, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, RefreshCw } from 'lucide-react-native';
import { LocationData } from '@/hooks/useLocation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PreciseLocationData extends LocationData {
  source: 'device' | 'geodnet' | 'hybrid';
  correctionApplied: boolean;
  hdop?: number; // Horizontal Dilution of Precision
  satellites?: number;
}

interface PreciseLocationServiceProps {
  deviceLocation: LocationData | null;
  onLocationUpdate?: (location: PreciseLocationData) => void;
  enabled?: boolean;
}

export default function PreciseLocationService({
  deviceLocation,
  onLocationUpdate,
  enabled = true,
}: PreciseLocationServiceProps) {
  const [preciseLocation, setPreciseLocation] = useState<PreciseLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  // Simulate precise location API call
  // In production, this would call the actual AgentSphere /api/get-precise-location endpoint
  const fetchPreciseLocation = async (): Promise<PreciseLocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo purposes, we'll enhance the device location with simulated precision data
      if (!deviceLocation) {
        throw new Error('Device location required for precise location calculation');
      }

      // Simulate GEODNET correction (small adjustments to coordinates)
      const correctionLat = (Math.random() - 0.5) * 0.00001; // ~1 meter correction
      const correctionLng = (Math.random() - 0.5) * 0.00001;

      const enhancedLocation: PreciseLocationData = {
        latitude: deviceLocation.latitude + correctionLat,
        longitude: deviceLocation.longitude + correctionLng,
        altitude: deviceLocation.altitude ? deviceLocation.altitude + (Math.random() - 0.5) * 2 : undefined,
        accuracy: Math.random() * 2 + 0.5, // 0.5-2.5 meter accuracy
        timestamp: Date.now(),
        source: 'geodnet',
        correctionApplied: true,
        hdop: Math.random() * 2 + 1, // 1-3 HDOP
        satellites: Math.floor(Math.random() * 8) + 8, // 8-15 satellites
      };

      setPreciseLocation(enhancedLocation);
      setLastUpdate(Date.now());
      onLocationUpdate?.(enhancedLocation);
      
      return enhancedLocation;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get precise location';
      setError(errorMessage);
      
      // Fallback to device location with lower precision
      if (deviceLocation) {
        const fallbackLocation: PreciseLocationData = {
          ...deviceLocation,
          source: 'device',
          correctionApplied: false,
        };
        setPreciseLocation(fallbackLocation);
        onLocationUpdate?.(fallbackLocation);
        return fallbackLocation;
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when device location changes
  useEffect(() => {
    if (enabled && deviceLocation && !isLoading) {
      fetchPreciseLocation();
    }
  }, [deviceLocation, enabled]);

  const handleManualRefresh = () => {
    if (!deviceLocation) {
      Alert.alert(
        'Location Required',
        'Please enable device location services first.',
        [{ text: 'OK' }]
      );
      return;
    }
    fetchPreciseLocation();
  };

  const getSourceIcon = () => {
    if (!preciseLocation) return <Satellite size={20} color="#666" strokeWidth={2} />;
    
    switch (preciseLocation.source) {
      case 'geodnet':
        return <Satellite size={20} color="#00ff88" strokeWidth={2} />;
      case 'hybrid':
        return <Zap size={20} color="#00d4ff" strokeWidth={2} />;
      default:
        return <Satellite size={20} color="#ff9500" strokeWidth={2} />;
    }
  };

  const getSourceLabel = () => {
    if (!preciseLocation) return 'No Data';
    
    switch (preciseLocation.source) {
      case 'geodnet':
        return 'GEODNET Corrected';
      case 'hybrid':
        return 'Hybrid Positioning';
      default:
        return 'Device GPS';
    }
  };

  const getAccuracyLevel = () => {
    if (!preciseLocation?.accuracy) return 'Unknown';
    
    const accuracy = preciseLocation.accuracy;
    if (accuracy < 1) return 'Centimeter';
    if (accuracy < 3) return 'Sub-meter';
    if (accuracy < 5) return 'High';
    return 'Standard';
  };

  const getAccuracyColor = () => {
    if (!preciseLocation?.accuracy) return '#666';
    
    const accuracy = preciseLocation.accuracy;
    if (accuracy < 1) return '#00ff88';
    if (accuracy < 3) return '#00d4ff';
    if (accuracy < 5) return '#ff9500';
    return '#ff6b35';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            {getSourceIcon()}
          </View>
          <View>
            <Text style={styles.title}>Precise Location</Text>
            <Text style={styles.subtitle}>{getSourceLabel()}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {isLoading && <LoadingSpinner size={20} />}
          {preciseLocation?.correctionApplied && (
            <CheckCircle size={16} color="#00ff88" strokeWidth={2} />
          )}
        </View>
      </View>

      {/* Status */}
      {!enabled && (
        <View style={styles.disabledSection}>
          <Text style={styles.disabledText}>
            Precise location service is disabled
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorSection}>
          <AlertTriangle size={16} color="#ff6b35" strokeWidth={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Location Data */}
      {preciseLocation && (
        <View style={styles.dataSection}>
          <View style={styles.accuracyRow}>
            <Text style={styles.label}>Accuracy Level</Text>
            <View style={styles.accuracyContainer}>
              <Text style={[
                styles.accuracyLevel,
                { color: getAccuracyColor() }
              ]}>
                {getAccuracyLevel()}
              </Text>
              {preciseLocation.accuracy && (
                <Text style={styles.accuracyValue}>
                  ±{preciseLocation.accuracy.toFixed(2)}m
                </Text>
              )}
            </View>
          </View>

          {preciseLocation.correctionApplied && (
            <View style={styles.correctionRow}>
              <CheckCircle size={16} color="#00ff88" strokeWidth={2} />
              <Text style={styles.correctionText}>
                GEODNET correction applied for enhanced accuracy
              </Text>
            </View>
          )}

          {preciseLocation.satellites && (
            <View style={styles.metricRow}>
              <Text style={styles.label}>Satellites</Text>
              <Text style={styles.value}>{preciseLocation.satellites}</Text>
            </View>
          )}

          {preciseLocation.hdop && (
            <View style={styles.metricRow}>
              <Text style={styles.label}>HDOP</Text>
              <Text style={styles.value}>{preciseLocation.hdop.toFixed(2)}</Text>
            </View>
          )}

          {lastUpdate && (
            <View style={styles.metricRow}>
              <Text style={styles.label}>Last Update</Text>
              <Text style={styles.value}>
                {new Date(lastUpdate).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleManualRefresh}
          activeOpacity={0.7}
          disabled={isLoading || !enabled}
        >
          <RefreshCw size={16} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Updating...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Precise location uses GEODNET-corrected GPS data for centimeter-level accuracy, 
          essential for accurate AR object placement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // Status sections
  disabledSection: {
    backgroundColor: '#66666620',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  disabledText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
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
  
  // Data section
  dataSection: {
    gap: 12,
    marginBottom: 20,
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
  accuracyLevel: {
    fontSize: 16,
    fontWeight: '600',
  },
  accuracyValue: {
    fontSize: 14,
    color: '#aaa',
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff8820',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  correctionText: {
    fontSize: 14,
    color: '#00ff88',
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#aaa',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Controls
  controls: {
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
  },
  
  // Info
  infoSection: {
    backgroundColor: '#00d4ff20',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#00d4ff',
    lineHeight: 16,
    textAlign: 'center',
  },
});