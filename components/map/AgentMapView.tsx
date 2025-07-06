// This file is a placeholder that will be replaced by the platform-specific implementations
// AgentMapView.web.tsx for web and AgentMapView.native.tsx for mobile

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

interface AgentMapViewProps {
  userLocation: LocationData;
  agents: DeployedObject[];
  onClose: () => void;
  onSwitchToCamera: () => void;
  onAgentSelect?: (agent: DeployedObject) => void;
}

// This is a fallback component that should never be used
// The platform-specific versions will be automatically selected
export default function AgentMapView(props: AgentMapViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map not available on this platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
});