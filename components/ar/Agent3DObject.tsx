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
  isInRange?: boolean;
  onPress?: () => void;
}

export default function Agent3DObject({ agent, size = 50, isInRange = false, onPress }: Agent3DObjectProps) {
  const rotateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  
  // Get object type and color based on agent type
  const objectType = getObjectTypeFromAgentType(agent.object_type);
  const objectColor = getAgentColor(agent.object_type);
  
  // Start rotation animation immediately
  useEffect(() => {
    // Rotate Y axis (horizontal spin)
    rotateY.value = withRepeat(
      withTiming(360, { 
        duration: isInRange ? 6000 : 8000 + Math.random() * 4000, // Faster rotation when in range
        easing: Easing.linear 
      }),
      -1, // Infinite repetitions
      false // Don't reverse
    );
    
    // Slight tilt on X axis
    rotateX.value = withRepeat(
      withTiming(15, { 
        duration: isInRange ? 4000 : 6000 + Math.random() * 3000,
        easing: Easing.inOut(Easing.sine) 
      }),
      -1, // Infinite repetitions
      true // Reverse (back and forth)
    );
    
    // Add pulse effect when in range
    if (isInRange) {
      scaleAnim.value = withRepeat(
        withTiming(1.15, { 
          duration: 1000,
          easing: Easing.inOut(Easing.ease) 
        }),
        -1,
        true
      );
    } else {
      scaleAnim.value = withTiming(1, { duration: 300 });
    }
  }, [isInRange]);

  // Create animated styles for rotation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 800 },
        { scale: scaleAnim.value },
        { rotateY: `${rotateY.value}deg` },
        { rotateX: `${rotateX.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View 
        style={[
          styles.object, 
          { 
            width: size, 
            height: size
          }
        ]}
        onTouchEnd={onPress}
      >
        <View style={[
          styles.objectInner,
          getObjectStyle(objectType, objectColor, size),
          isInRange && styles.objectInnerInRange
        ]} />
      </View>
      
      {isInRange && (
        <View style={[styles.glowEffect, { width: size * 1.5, height: size * 1.5 }]}>
          <View style={[styles.glow, { backgroundColor: objectColor }]} />
        </View>
      )}
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
    'Game Agent': 'cube',
    'test-object': 'cube',
    'info-sphere': 'sphere',
    'test-cube': 'cube',
    'test-sphere': 'sphere'
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
    'Game Agent': '#06B6D4',      // Cyan
    'test-object': '#3B82F6',     // Blue
    'info-sphere': '#10B981',     // Green
    'test-cube': '#EC4899',       // Pink
    'test-sphere': '#F59E0B'      // Amber
  };
  
  return colors[agentType || ''] || '#00d4ff';
}

// Get style based on object type
function getObjectStyle(objectType: string, color: string, size: number): object {
  const baseStyle = {
    backgroundColor: color,
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  };
  
  switch (objectType) {
    case 'cube':
      return {
        ...baseStyle,
        borderRadius: size * 0.1,
      };
    case 'sphere':
      return {
        ...baseStyle,
        borderRadius: size / 2, // Full circle
      };
    case 'pyramid':
      return {
        ...baseStyle,
        borderRadius: size * 0.1,
        transform: [{ rotateZ: '45deg' }, { scaleY: 0.7 }],
      };
    case 'cylinder':
      return {
        ...baseStyle,
        borderRadius: size * 0.2,
        height: size * 1.2,
      };
    case 'octahedron':
      return {
        ...baseStyle,
        borderRadius: size * 0.15,
        transform: [{ rotate: '45deg' }],
      };
    case 'torus':
      return {
        ...baseStyle,
        borderRadius: size / 2,
        borderWidth: size * 0.15,
        borderColor: color,
        backgroundColor: 'transparent',
      };
    default:
      return {
        ...baseStyle,
        borderRadius: size * 0.1,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'visible',
  },
  object: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    backfaceVisibility: 'visible',
  },
  objectInner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'visible'
  },
  objectInnerInRange: {
    borderWidth: 2,
    borderColor: '#ffffff80'
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
    zIndex: -1
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    opacity: 0.3,
    transform: [{ scale: 0.8 }]
  },
});