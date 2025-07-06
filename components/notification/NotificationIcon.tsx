import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Bell, BellRing, MapPin } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DeployedObject } from '@/types/database';

interface NotificationIconProps {
  agentsInRange: DeployedObject[];
  userLocation?: LocationData | null;
  onPress: () => void;
}

export default function NotificationIcon({ agentsInRange, userLocation, onPress }: NotificationIconProps) {
  const [isInRange, setIsInRange] = useState(false);
  const pulseAnim = useSharedValue(1);
  
  // Start animation when agents are in range
  useEffect(() => {
    const hasAgentsInRange = agentsInRange.length > 0;
    setIsInRange(hasAgentsInRange);

    if (hasAgentsInRange) {
      // Start pulsing animation
      pulseAnim.value = withRepeat(
        withTiming(1.2, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite repetitions
        true // Reverse (back and forth)
      );
    } else {
      // Reset animation
      pulseAnim.value = withTiming(1, { duration: 300 });
    }
  }, [agentsInRange.length]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

  const getIconColor = () => {
    if (agentsInRange.length === 0) return '#6B7280'; // Gray
    if (agentsInRange.length <= 2) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getBackgroundColor = () => {
    if (agentsInRange.length === 0) return 'rgba(107, 114, 128, 0.1)';
    if (agentsInRange.length <= 2) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(239, 68, 68, 0.1)';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.button,
          { backgroundColor: getBackgroundColor() }
        ]}
        activeOpacity={0.7}
      >
        <Animated.View style={animatedStyle}>
          {isInRange ? (
            <BellRing size={24} color={getIconColor()} strokeWidth={2} />
          ) : (
            <Bell size={24} color={getIconColor()} strokeWidth={2} />
          )}
        </Animated.View>
        
        {agentsInRange.length > 0 && (
          <View style={[styles.badge, { backgroundColor: getIconColor() }]}>
            <Text style={styles.badgeText}>
              {agentsInRange.length > 9 ? '9+' : agentsInRange.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {isInRange && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {agentsInRange.length} agent{agentsInRange.length !== 1 ? 's' : ''} nearby
        </Text>
        {userLocation && (
          <View style={styles.locationInfo}>
            <MapPin size={12} color="#00d4ff" strokeWidth={2} />
            <Text style={styles.locationText}>
              {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
    )}
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tooltip: {
    position: 'absolute',
    top: 55,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 100,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    color: '#00d4ff',
    fontSize: 10,
  },
});