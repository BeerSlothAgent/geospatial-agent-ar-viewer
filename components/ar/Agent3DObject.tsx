import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { DeployedObject } from '@/types/database';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Agent3DObjectProps {
  agent: DeployedObject;
  size?: number;
  onPress?: () => void;
}

export default function Agent3DObject({ agent, size = 50, onPress }: Agent3DObjectProps) {
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  
  // Get object type and color based on agent type
  const objectType = getObjectTypeFromAgentType(agent.object_type);
  const objectColor = getAgentColor(agent.object_type);
  
  // Start rotation animation
  useEffect(() => {
    // Rotate Y axis (horizontal spin)
    setTimeout(() => {
      rotateY.value = withRepeat(
        withTiming(360, { 
          duration: 10000 + Math.random() * 5000, // Random duration for varied speeds
          easing: Easing.linear 
        }),
        -1, // Infinite repetitions
        false // Don't reverse
      );
    }, 100);
    
    // Slight tilt on X axis
    setTimeout(() => {
      rotateX.value = withRepeat(
        withTiming(10, { 
          duration: 8000 + Math.random() * 4000,
          easing: Easing.inOut(Easing.sine) 
        }),
        -1, // Infinite repetitions
        true // Reverse (back and forth)
      );
    }, 200);
  }, []);

  // Create animated styles for rotation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${rotateY.value}deg` },
        { rotateX: `${rotateX.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View 
        style={[styles.object, { width: size, height: size }]}
        onTouchEnd={onPress}
      >
        <View style={[
          styles.objectInner,
          getObjectStyle(objectType, objectColor),
        ]} />
      </View>
    </Animated.View>
  );
}

// Map agent types to 3D object types
function getObjectTypeFromAgentType(agentType?: string): string {
  const objectMapping: Record<string, string> = {
    'ai_agent': 'cube',
    'study_buddy': 'sphere', 
    'tutor': 'pyramid',
    'landmark': 'cylinder',
    'building': 'cube',
    'Intelligent Assistant': 'octahedron',
    'Content Creator': 'torus',
    'Local Services': 'cube',
    'Tutor/Teacher': 'pyramid',
    '3D World Modelling': 'sphere',
    'Game Agent': 'cube'
  };
  
  return objectMapping[agentType || ''] || 'cube';
}

// Get color based on agent type
function getAgentColor(agentType?: string): string {
  const colors: Record<string, string> = {
    'ai_agent': '#3B82F6',        // Blue
    'study_buddy': '#10B981',     // Green
    'tutor': '#8B5CF6',           // Purple
    'landmark': '#F59E0B',        // Amber
    'building': '#6B7280',        // Gray
    'Intelligent Assistant': '#EC4899', // Pink
    'Content Creator': '#EF4444', // Red
    'Local Services': '#14B8A6',  // Teal
    'Tutor/Teacher': '#7C3AED',   // Violet
    '3D World Modelling': '#F97316', // Orange
    'Game Agent': '#06B6D4'       // Cyan
  };
  
  return colors[agentType || ''] || '#00d4ff';
}

// Get style based on object type
function getObjectStyle(objectType: string, color: string): object {
  const baseStyle = {
    backgroundColor: color,
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  };
  
  switch (objectType) {
    case 'cube':
      return {
        ...baseStyle,
        borderRadius: 4,
      };
    case 'sphere':
      return {
        ...baseStyle,
        borderRadius: 50, // Full circle
      };
    case 'pyramid':
      return {
        ...baseStyle,
        borderRadius: 4,
        transform: [{ rotateZ: '45deg' }, { scaleY: 0.7 }],
      };
    case 'cylinder':
      return {
        ...baseStyle,
        borderRadius: 10,
        height: '120%',
      };
    case 'octahedron':
      return {
        ...baseStyle,
        borderRadius: 8,
        transform: [{ rotate: '45deg' }],
      };
    case 'torus':
      return {
        ...baseStyle,
        borderRadius: 50,
        borderWidth: 8,
        borderColor: color,
        backgroundColor: 'transparent',
      };
    default:
      return {
        ...baseStyle,
        borderRadius: 4,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  object: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  objectInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});