import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'pending';
  text: string;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ 
  status, 
  text, 
  size = 'medium' 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          backgroundColor: '#00ff8820',
          borderColor: '#00ff88',
          textColor: '#00ff88',
          icon: <CheckCircle size={16} color="#00ff88" strokeWidth={2} />,
        };
      case 'error':
        return {
          backgroundColor: '#ff6b3520',
          borderColor: '#ff6b35',
          textColor: '#ff6b35',
          icon: <AlertCircle size={16} color="#ff6b35" strokeWidth={2} />,
        };
      case 'pending':
        return {
          backgroundColor: '#00d4ff20',
          borderColor: '#00d4ff',
          textColor: '#00d4ff',
          icon: <Clock size={16} color="#00d4ff" strokeWidth={2} />,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = styles[size];

  return (
    <View
      style={[
        styles.badge,
        sizeStyles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      {config.icon}
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: config.textColor },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
  
  // Size variants
  small: {
    container: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      fontSize: 12,
    },
  },
  medium: {
    container: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    text: {
      fontSize: 14,
    },
  },
  large: {
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    text: {
      fontSize: 16,
    },
  },
});