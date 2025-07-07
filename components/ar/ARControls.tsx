import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, RotateCcw, Settings, Zap, ZapOff } from 'lucide-react-native';
import { ARSessionState } from '@/types/ar';

interface ARControlsProps {
  sessionState: ARSessionState;
  onEndSession: () => void;
  onToggleOrientation: () => void;
  onSettings?: () => void;
}

export default function ARControls({
  sessionState,
  onEndSession,
  onToggleOrientation,
  onSettings,
}: ARControlsProps) {

  return (
    <View style={styles.container}>
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onEndSession}
          activeOpacity={0.7}
        >
          <X size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>

        {onSettings && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onSettings}
            activeOpacity={0.7}
          >
            <Settings size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Side Controls */}
      {sessionState.isActive && (
        <View style={styles.sideControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onToggleOrientation}
            activeOpacity={0.7}
          >
            <RotateCcw size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Info */}
      {sessionState.isActive && (
        <View style={styles.bottomInfo}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}> 
              Move your device to look around • Tap NEAR objects to interact
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },

  // Top controls
  topControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    pointerEvents: 'auto',
  },

  // Side controls
  sideControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -50 }],
    gap: 12,
    pointerEvents: 'auto',
  },

  // Control button
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Bottom info
  bottomInfo: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    pointerEvents: 'none',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
});