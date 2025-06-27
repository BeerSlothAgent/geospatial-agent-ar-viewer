import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cuboid as Cube, Zap, Wifi, WifiOff, Eye, Target } from 'lucide-react-native';
import { ARSessionState, ARCapabilities } from '@/types/ar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';

interface AROverlayProps {
  sessionState: ARSessionState;
  capabilities: ARCapabilities;
  objectsInView: string[];
  onObjectSelect?: (objectId: string) => void;
}

export default function AROverlay({
  sessionState,
  capabilities,
  objectsInView,
  onObjectSelect,
}: AROverlayProps) {

  const getSessionStatus = () => {
    if (sessionState.isLoading) return 'Initializing AR...';
    if (sessionState.error) return 'AR Error';
    if (sessionState.isActive) return 'AR Active';
    return 'AR Inactive';
  };

  const getSessionStatusColor = () => {
    if (sessionState.error) return '#ff6b35';
    if (sessionState.isActive) return '#00ff88';
    return '#666';
  };

  return (
    <View style={styles.overlay}>
      {/* Top Status Bar */}
      <View style={styles.topBar}>
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            {sessionState.isLoading ? (
              <LoadingSpinner size={16} />
            ) : sessionState.isActive ? (
              <Wifi size={16} color="#00ff88" strokeWidth={2} />
            ) : (
              <WifiOff size={16} color="#ff6b35" strokeWidth={2} />
            )}
            <Text style={[styles.statusText, { color: getSessionStatusColor() }]}>
              {getSessionStatus()}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Cube size={16} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.statusText}>
              {sessionState.objectsLoaded} objects
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Eye size={16} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.statusText}>
              {objectsInView.length} visible
            </Text>
          </View>
        </View>
      </View>

      {/* Center Crosshair */}
      {sessionState.isActive && (
        <View style={styles.crosshairContainer}>
          <View style={styles.crosshair}>
            <View style={styles.crosshairLine} />
            <View style={[styles.crosshairLine, styles.crosshairLineVertical]} />
          </View>
          <Target size={24} color="#00d4ff" strokeWidth={2} style={styles.crosshairIcon} />
        </View>
      )}

      {/* Bottom Info Panel */}
      <View style={styles.bottomPanel}>
        {/* Error Display */}
        {sessionState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>AR Session Error</Text>
            <Text style={styles.errorMessage}>{sessionState.error}</Text>
          </View>
        )}

        {/* Capabilities Info */}
        {!sessionState.isActive && !sessionState.isLoading && (
          <View style={styles.capabilitiesContainer}>
            <Text style={styles.capabilitiesTitle}>Device Capabilities</Text>
            <View style={styles.capabilitiesList}>
              <StatusBadge
                status={capabilities.webGLSupported ? 'success' : 'error'}
                text="WebGL"
                size="small"
              />
              <StatusBadge
                status={capabilities.deviceOrientationSupported ? 'success' : 'error'}
                text="Orientation"
                size="small"
              />
              <StatusBadge
                status={capabilities.cameraSupported ? 'success' : 'error'}
                text="Camera"
                size="small"
              />
              <StatusBadge
                status="pending"
                text={`${capabilities.performanceLevel} performance`}
                size="small"
              />
            </View>
          </View>
        )}

        {/* Performance Stats */}
        {sessionState.isActive && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>FPS</Text>
              <Text style={styles.statValue}>{sessionState.renderStats.fps}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Triangles</Text>
              <Text style={styles.statValue}>{sessionState.renderStats.triangles}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Draw Calls</Text>
              <Text style={styles.statValue}>{sessionState.renderStats.drawCalls}</Text>
            </View>
          </View>
        )}

        {/* Objects in View */}
        {objectsInView.length > 0 && (
          <View style={styles.objectsContainer}>
            <Text style={styles.objectsTitle}>Objects in View</Text>
            <View style={styles.objectsList}>
              {objectsInView.slice(0, 3).map((objectId) => (
                <TouchableOpacity
                  key={objectId}
                  style={styles.objectItem}
                  onPress={() => onObjectSelect?.(objectId)}
                  activeOpacity={0.7}
                >
                  <Cube size={16} color="#00d4ff" strokeWidth={2} />
                  <Text style={styles.objectText}>Object {objectId.slice(0, 8)}</Text>
                </TouchableOpacity>
              ))}
              {objectsInView.length > 3 && (
                <Text style={styles.moreObjectsText}>
                  +{objectsInView.length - 3} more
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Loading Overlay */}
      {sessionState.isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Initializing AR Session...</Text>
          <Text style={styles.loadingSubtext}>
            Setting up 3D rendering and object tracking
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },

  // Top status bar
  topBar: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    pointerEvents: 'none',
  },
  statusSection: {
    flexDirection: 'row',
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Center crosshair
  crosshairContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshair: {
    position: 'absolute',
    width: 40,
    height: 40,
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
  crosshairIcon: {
    opacity: 0.6,
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 16,
  },

  // Error container
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    borderRadius: 12,
    padding: 16,
    pointerEvents: 'auto',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },

  // Capabilities container
  capabilitiesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    pointerEvents: 'auto',
  },
  capabilitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  capabilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Stats container
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    gap: 16,
    pointerEvents: 'none',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#aaa',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Objects container
  objectsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    pointerEvents: 'auto',
  },
  objectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  objectsList: {
    gap: 8,
  },
  objectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  objectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00d4ff',
  },
  moreObjectsText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});